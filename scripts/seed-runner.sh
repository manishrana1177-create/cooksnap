#!/bin/bash
# Recipe database seeding script - small batches to avoid crashes
# Run: bash scripts/seed-runner.sh

BASE_URL="http://localhost:3000/api/seed/recipes"
TARGET=2000

# Check current count
echo "🍳 Checking current recipe count..."
STATUS=$(curl -s "$BASE_URL" 2>/dev/null)
CURRENT=$(echo "$STATUS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',0))" 2>/dev/null || echo "0")
echo "Current recipes in database: $CURRENT"

if [ "$CURRENT" -ge "$TARGET" ]; then
  echo "✅ Already have $CURRENT recipes (target: $TARGET). Done!"
  exit 0
fi

echo "Need to add $((TARGET - CURRENT)) more recipes"
echo ""

# Cuisine batches: "cuisine:category" - each call generates 5 recipes
# We call each cuisine multiple times based on desired count
# Format: cuisine:category:repeats (each repeat = 5 recipes)
BATCHES=(
  "North Indian:main:24"       # 120 recipes
  "South Indian:breakfast:20"  # 100
  "Mughlai:main:12"            # 60
  "Indian Street Food:snack:14" # 70
  "Indian Desserts:dessert:14"  # 70
  "Gujarati:main:10"            # 50
  "Bengali:main:10"             # 50
  "Punjabi:main:10"             # 50
  "Rajasthani:main:8"           # 40
  "Maharashtrian:main:8"        # 40
  "Kerala:main:8"               # 40
  "Indian Drinks:drink:8"       # 40
  "Indian Soups and Salads:soup:8" # 40
  "Indian Pickles and Chutneys:side:8" # 40
  "Andhra:main:6"               # 30
  "Tamil Nadu:main:6"           # 30
  "Hyderabadi:main:6"           # 30
  "Chinese:main:20"             # 100
  "Thai:main:12"                # 60
  "Japanese:main:12"            # 60
  "Korean:main:10"              # 50
  "Italian:main:20"             # 100
  "Mexican:main:14"             # 70
  "American:main:12"            # 60
  "French:main:10"              # 50
  "Mediterranean:main:10"       # 50
  "Spanish:main:8"              # 40
  "Greek:main:6"                # 30
  "Middle Eastern:main:10"      # 50
  "Turkish:main:6"              # 30
  "Lebanese:main:5"             # 25
  "Moroccan:main:4"             # 20
  "Vietnamese:main:6"           # 30
  "Indonesian:main:5"           # 25
  "British:main:5"              # 25
  "German:main:4"               # 20
  "Brazilian:main:3"            # 15
  "Kashmiri:main:4"             # 20
  "Goan:main:4"                 # 20
  "Sindhi:main:3"               # 15
  "Awadhi:main:3"               # 15
  "Chettinad:main:3"            # 15
  "Malaysian:main:4"            # 20
  "Filipino:main:4"             # 20
  "Singaporean:main:3"          # 15
  "Ethiopian:main:3"            # 15
  "Continental:main:8"          # 40
  "Fusion:main:6"               # 30
  "Healthy:salad:8"             # 40
  "World Desserts:dessert:6"    # 30
  "World Soups:soup:5"          # 25
  "World Appetizers:appetizer:5" # 25
)

BATCH_NUM=0
TOTAL_BATCHES=${#BATCHES[@]}

for batch in "${BATCHES[@]}"; do
  IFS=':' read -r cuisine category repeats <<< "$batch"
  
  for ((i=1; i<=repeats; i++)); do
    # Check current count
    CURRENT=$(curl -s "$BASE_URL" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',0))" 2>/dev/null || echo "0")
    
    if [ "$CURRENT" -ge "$TARGET" ]; then
      echo ""
      echo "✅ Reached $TARGET recipes target!"
      exit 0
    fi
    
    BATCH_NUM=$((BATCH_NUM + 1))
    echo "[$BATCH_NUM] $cuisine #$i ($category) | DB: $CURRENT/$TARGET"
    
    RESULT=$(curl -s -X POST "$BASE_URL" \
      -H "Content-Type: application/json" \
      -d "{\"cuisine\":\"$cuisine\",\"count\":5,\"category\":\"$category\"}" \
      --max-time 120 2>/dev/null)
    
    if [ -n "$RESULT" ]; then
      SAVED=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('saved',0))" 2>/dev/null || echo "?")
      TOTAL=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('totalInDb',0))" 2>/dev/null || echo "?")
      echo "  → saved: $SAVED | total: $TOTAL"
    else
      echo "  → No response, waiting for server..."
      sleep 10
      # Try to restart if needed
      if ! curl -s http://localhost:3000/api/seed/recipes > /dev/null 2>&1; then
        echo "  → Server down, restarting..."
        pkill -f "next dev" 2>/dev/null
        sleep 2
        cd /home/z/my-project && nohup npx next dev -p 3000 > /tmp/next-dev.log 2>&1 &
        sleep 10
      fi
    fi
    
    sleep 3
  done
done

# Final count
FINAL=$(curl -s "$BASE_URL" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',0))" 2>/dev/null || echo "?")
echo ""
echo "🎉 Seeding complete! Total recipes: $FINAL"
