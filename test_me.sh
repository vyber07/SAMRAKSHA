#!/bin/bash
export BASE_URL="http://localhost"
AUTH_RES=$(curl -s -X POST $BASE_URL/auth/login -H 'Content-Type: application/json' -d '{"badge_no":"DCP001","password":"Demo@2026"}')
TOKEN=$(echo $AUTH_RES | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
curl -s -w '\n%{http_code}\n' -H "Authorization: Bearer $TOKEN" $BASE_URL/auth/me
