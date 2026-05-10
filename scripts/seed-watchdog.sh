#!/bin/bash
# Watchdog v2 - calls one-shot seeder repeatedly
# Each call generates ONE batch of 5 recipes
cd /home/z/my-project

MAX_CALLS=300   # 300 calls × 5 recipes = 1500 max
DELAY=5         # seconds between calls
TIMEOUT=120     # seconds per call (2 min max per AI call)
CALL=0
FAILS=0
MAX_FAILS=10

while [ $CALL -lt $MAX_CALLS ] && [ $FAILS -lt $MAX_FAILS ]; do
  CALL=$((CALL + 1))
  
  # Run one batch with timeout
  RESULT=$(timeout $TIMEOUT node scripts/seed-one-batch.cjs 2>&1)
  CODE=$?
  
  TIMESTAMP=$(date '+%H:%M:%S')
  
  if [ $CODE -eq 2 ]; then
    # All targets reached!
    echo "[$TIMESTAMP] ✅ $RESULT" >> seed-watchdog.log
    break
  elif [ $CODE -eq 0 ]; then
    # Success
    FAILS=0
    echo "[$TIMESTAMP] #$CALL: $RESULT" >> seed-watchdog.log
  elif [ $CODE -eq 124 ]; then
    # Timeout
    FAILS=$((FAILS + 1))
    echo "[$TIMESTAMP] #$CALL: TIMEOUT" >> seed-watchdog.log
  else
    # Error
    FAILS=$((FAILS + 1))
    echo "[$TIMESTAMP] #$CALL: ERROR ($RESULT)" >> seed-watchdog.log
  fi
  
  sleep $DELAY
done

TOTAL=$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{console.log(await p.recipe.count());await p.\$disconnect()})()" 2>/dev/null || echo "?")
echo "[$(date '+%H:%M:%S')] Watchdog done. Total: $TOTAL recipes. Calls: $CALL. Fails: $FAILS" >> seed-watchdog.log
