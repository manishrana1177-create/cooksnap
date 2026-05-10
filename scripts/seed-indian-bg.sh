#!/bin/bash
# Robust background recipe seeder for CookSnap
# Seeds Indian cuisines via the API with auto-retry and server health checks

set -euo pipefail

API_URL="http://localhost:3000/api/seed/recipes"
STATUS_URL="http://localhost:3000/api/seed/recipes"
BATCH_SIZE=5
DELAY_BETWEEN_CALLS=10  # seconds
DELAY_ON_ERROR=30       # seconds
MAX_CONSECUTIVE_ERRORS=5

# Cuisine targets: "cuisine:target:categories"
CUISINES=(
  "North Indian:200:main,breakfast,snack,dessert,side"
  "South Indian:135:breakfast,main,snack,dessert,side"
  "East Indian:70:main,snack,dessert,side,soup"
  "West Indian:90:main,snack,breakfast,dessert,side"
  "Indo-Chinese:60:main,snack,appetizer,soup,side"
  "Street Food:80:snack,appetizer,main,side,drink"
  "Fast Food & Cafe:60:main,snack,drink,side,breakfast"
  "Healthy & Fitness:100:main,salad,breakfast,snack,drink"
  "Vegetarian:175:main,breakfast,snack,dessert,side,salad"
  "Non-Vegetarian:120:main,appetizer,soup,snack,side"
)

LOG_FILE="/home/z/my-project/seed-progress.log"
echo "========================================" | tee -a "$LOG_FILE"
echo "Seeding started at $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

check_server() {
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/seed/recipes 2>/dev/null || echo "000"
}

wait_for_server() {
  local attempts=0
  while [[ $(check_server) != "200" ]]; do
    attempts=$((attempts + 1))
    if [[ $attempts -gt 30 ]]; then
      echo "ERROR: Server not responding after 30 attempts" | tee -a "$LOG_FILE"
      return 1
    fi
    echo "Waiting for server... (attempt $attempts)" | tee -a "$LOG_FILE"
    sleep 5
  done
  echo "Server is up!" | tee -a "$LOG_FILE"
}

get_current_count() {
  local cuisine="$1"
  local stats
  stats=$(curl -s "$STATUS_URL" --max-time 15 2>/dev/null || echo '{}')
  echo "$stats" | node -e "
    const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
    const found = (data.byCuisine || []).find(c => c.cuisine === '$cuisine');
    console.log(found ? found.count : 0);
  " 2>/dev/null || echo "0"
}

seed_cuisine() {
  local cuisine="$1"
  local target="$2"
  local categories_str="$3"
  local consecutive_errors=0

  # Convert categories to array
  IFS=',' read -ra categories <<< "$categories_str"
  local cat_index=0

  echo "" | tee -a "$LOG_FILE"
  echo "🍽️  Starting: $cuisine (target: $target)" | tee -a "$LOG_FILE"

  while true; do
    local current
    current=$(get_current_count "$cuisine")
    local remaining=$((target - current))

    if [[ $remaining -le 0 ]]; then
      echo "✅ $cuisine: DONE ($current/$target)" | tee -a "$LOG_FILE"
      return 0
    fi

    local category="${categories[$((cat_index % ${#categories[@]}))]}"
    cat_index=$((cat_index + 1))

    echo "  📦 $cuisine: $current/$target (need $remaining more) — category: $category" | tee -a "$LOG_FILE"

    local response
    response=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{\"cuisine\":\"$cuisine\",\"count\":$BATCH_SIZE,\"category\":\"$category\"}" \
      --max-time 180 2>&1)

    if [[ -z "$response" ]] || echo "$response" | grep -qi "error\|fail\|timeout\|refused"; then
      consecutive_errors=$((consecutive_errors + 1))
      echo "  ❌ Error: $response" | tee -a "$LOG_FILE"

      if [[ $consecutive_errors -ge $MAX_CONSECUTIVE_ERRORS ]]; then
        echo "  🛑 Too many errors, skipping to next cuisine" | tee -a "$LOG_FILE"
        return 1
      fi

      echo "  ⏳ Waiting ${DELAY_ON_ERROR}s before retry..." | tee -a "$LOG_FILE"
      sleep "$DELAY_ON_ERROR"

      # Check server health
      if [[ $(check_server) != "200" ]]; then
        echo "  ⚠️ Server down, waiting..." | tee -a "$LOG_FILE"
        wait_for_server || return 1
      fi
      continue
    fi

    # Parse response
    local saved
    saved=$(echo "$response" | node -e "
      try {
        const d = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
        console.log(d.saved || 0);
      } catch(e) { console.log(0); }
    " 2>/dev/null || echo "0")

    local total_in_db
    total_in_db=$(echo "$response" | node -e "
      try {
        const d = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
        console.log(d.totalInDb || 0);
      } catch(e) { console.log(0); }
    " 2>/dev/null || echo "0")

    echo "  ✅ Saved: $saved | Total in DB: $total_in_db" | tee -a "$LOG_FILE"
    consecutive_errors=0

    sleep "$DELAY_BETWEEN_CALLS"
  done
}

# Main execution
wait_for_server

for cuisine_config in "${CUISINES[@]}"; do
  IFS=':' read -r cuisine target categories <<< "$cuisine_config"
  seed_cuisine "$cuisine" "$target" "$categories"
done

# Final report
echo "" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "SEEDING COMPLETE at $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Get final stats
final_stats=$(curl -s "$STATUS_URL" --max-time 15 2>/dev/null || echo '{}')
echo "$final_stats" | node -e "
  try {
    const d = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
    console.log('Total recipes:', d.total);
    (d.byCuisine || []).forEach(c => console.log('  ' + c.cuisine + ': ' + c.count));
  } catch(e) { console.log('Could not parse stats'); }
" 2>/dev/null | tee -a "$LOG_FILE"
