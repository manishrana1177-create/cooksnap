#!/bin/bash
# Background recipe seeder - runs continuously until 2000 recipes
# Run: nohup bash scripts/seed-background.sh > /tmp/seed-log.txt 2>&1 &

BASE_URL="http://localhost:3000/api/seed/recipes"
TARGET=2000

CUISINES=(
  "South Indian:breakfast"
  "Mughlai:main"
  "Gujarati:main"
  "Bengali:main"
  "Rajasthani:main"
  "Maharashtrian:main"
  "Kerala:main"
  "Indian Street Food:snack"
  "Indian Desserts:dessert"
  "Chinese:main"
  "Italian:main"
  "Thai:main"
  "Japanese:main"
  "Mexican:main"
  "American:main"
  "French:main"
  "Mediterranean:main"
  "Korean:main"
  "Spanish:main"
  "Middle Eastern:main"
  "Indian Drinks:drink"
  "Indian Soups and Salads:soup"
  "Indian Pickles and Chutneys:side"
  "Andhra:main"
  "Tamil Nadu:main"
  "Hyderabadi:main"
  "Vietnamese:main"
  "Indonesian:main"
  "Greek:main"
  "Turkish:main"
  "Lebanese:main"
  "Moroccan:main"
  "Kashmiri:main"
  "Goan:main"
  "Continental:main"
  "Fusion:main"
  "Healthy:salad"
  "World Desserts:dessert"
  "World Soups:soup"
  "World Appetizers:appetizer"
)

ensure_server() {
  if ! curl -s --max-time 5 http://localhost:3000 > /dev/null 2>&1; then
    echo "[$(date +%H:%M:%S)] Restarting server..."
    pkill -f "next dev" 2>/dev/null
    sleep 3
    cd /home/z/my-project && nohup npx next dev -p 3000 > /tmp/next-dev.log 2>&1 &
    sleep 12
  fi
}

echo "[$(date +%H:%M:%S)] 🍳 Starting background seeder (target: $TARGET)..."

while true; do
  for entry in "${CUISINES[@]}"; do
    IFS=':' read -r cuisine category <<< "$entry"
    
    ensure_server
    
    # Check current count
    current=$(curl -s --max-time 5 "$BASE_URL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',0))" 2>/dev/null || echo "0")
    
    if [ "$current" -ge "$TARGET" ]; then
      echo "[$(date +%H:%M:%S)] ✅ Target reached: $current recipes!"
      exit 0
    fi
    
    echo "[$(date +%H:%M:%S)] $cuisine | DB: $current/$TARGET"
    
    result=$(curl -s -X POST "$BASE_URL" \
      -H "Content-Type: application/json" \
      -d "{\"cuisine\":\"$cuisine\",\"count\":5,\"category\":\"$category\"}" \
      --max-time 120 2>/dev/null)
    
    if [ -n "$result" ]; then
      saved=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('saved','?'))" 2>/dev/null || echo "?")
      total=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('totalInDb','?'))" 2>/dev/null || echo "?")
      echo "  → saved: $saved | total: $total"
    else
      echo "  → timeout"
    fi
    
    sleep 5
  done
done
