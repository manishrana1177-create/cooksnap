#!/bin/bash
# Robust recipe seeder - handles server restarts
BASE_URL="http://localhost:3000/api/seed/recipes"
TARGET=2000
COUNT=5  # Recipes per request

ensure_server() {
  if ! curl -s --max-time 5 http://localhost:3000/api/seed/recipes > /dev/null 2>&1; then
    echo "  [Restarting server...]"
    pkill -f "next dev" 2>/dev/null
    sleep 2
    cd /home/z/my-project && nohup npx next dev -p 3000 > /tmp/next-dev.log 2>&1 &
    sleep 10
  fi
}

seed_cuisine() {
  local cuisine=$1
  local category=$2
  local target=$3
  local count=0
  
  while [ $count -lt $target ]; do
    ensure_server
    
    local current=$(curl -s --max-time 5 "$BASE_URL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',0))" 2>/dev/null || echo "0")
    
    if [ "$current" -ge "$TARGET" ]; then
      echo "✅ Target reached: $current recipes!"
      return 0
    fi
    
    echo "  $cuisine #$((count/COUNT+1)) | DB: $current"
    
    local result=$(curl -s -X POST "$BASE_URL" \
      -H "Content-Type: application/json" \
      -d "{\"cuisine\":\"$cuisine\",\"count\":$COUNT,\"category\":\"$category\"}" \
      --max-time 120 2>/dev/null)
    
    if [ -n "$result" ]; then
      local saved=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('saved',0))" 2>/dev/null || echo "0")
      count=$((count + COUNT))
      echo "    → +$saved"
    else
      echo "    → timeout, retrying..."
      sleep 5
    fi
    
    sleep 3
  done
}

echo "🍳 Starting robust recipe seeding..."
ensure_server

# Each entry: cuisine:category:total_count
seed_cuisine "North Indian" "main" 120
seed_cuisine "South Indian" "breakfast" 100
seed_cuisine "Mughlai" "main" 60
seed_cuisine "Indian Street Food" "snack" 70
seed_cuisine "Indian Desserts" "dessert" 70
seed_cuisine "Punjabi" "main" 50
seed_cuisine "Gujarati" "main" 50
seed_cuisine "Bengali" "main" 50
seed_cuisine "Maharashtrian" "main" 40
seed_cuisine "Rajasthani" "main" 40
seed_cuisine "Kerala" "main" 40
seed_cuisine "Indian Drinks" "drink" 40
seed_cuisine "Indian Soups and Salads" "soup" 40
seed_cuisine "Indian Pickles and Chutneys" "side" 40
seed_cuisine "Andhra" "main" 30
seed_cuisine "Tamil Nadu" "main" 30
seed_cuisine "Hyderabadi" "main" 30
seed_cuisine "Chinese" "main" 100
seed_cuisine "Thai" "main" 60
seed_cuisine "Japanese" "main" 60
seed_cuisine "Korean" "main" 50
seed_cuisine "Italian" "main" 100
seed_cuisine "Mexican" "main" 70
seed_cuisine "American" "main" 60
seed_cuisine "French" "main" 50
seed_cuisine "Mediterranean" "main" 50
seed_cuisine "Spanish" "main" 40
seed_cuisine "Greek" "main" 30
seed_cuisine "Middle Eastern" "main" 50
seed_cuisine "Turkish" "main" 30
seed_cuisine "Vietnamese" "main" 30
seed_cuisine "Kashmiri" "main" 20
seed_cuisine "Goan" "main" 20
seed_cuisine "Continental" "main" 40
seed_cuisine "Fusion" "main" 30
seed_cuisine "Healthy" "salad" 40
seed_cuisine "World Desserts" "dessert" 30
seed_cuisine "World Soups" "soup" 25
seed_cuisine "World Appetizers" "appetizer" 25

ensure_server
FINAL=$(curl -s --max-time 5 "$BASE_URL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',0))" 2>/dev/null || echo "?")
echo ""
echo "🎉 Seeding complete! Total: $FINAL recipes"
