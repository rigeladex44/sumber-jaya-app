#!/bin/bash

# Kill any existing processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start React with IPv4 only, disable host check
HOST=127.0.0.1 DANGEROUSLY_DISABLE_HOST_CHECK=true npm start

