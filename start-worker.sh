#!/bin/bash
set -a
source .env.local
set +a
npx tsx src/lib/services/queue/worker.ts