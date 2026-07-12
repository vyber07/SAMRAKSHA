#!/bin/bash
export BASE_URL="http://localhost"

# Try logging in with SHO_SAT
AUTH_RES=$(curl -s -X POST $BASE_URL/auth/login -H 'Content-Type: application/json' -d '{"badge_no":"SHO_SAT","password":"password123"}')
TOKEN=$(echo $AUTH_RES | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    AUTH_RES=$(curl -s -X POST $BASE_URL/auth/login -H 'Content-Type: application/json' -d '{"badge_no":"DCP001","password":"password123"}')
    TOKEN=$(echo $AUTH_RES | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
fi

echo "Token: $TOKEN"

curl -s -w '\n%{http_code}' -H "Authorization: Bearer $TOKEN" $BASE_URL/cases/
echo ""
curl -s -w '\n%{http_code}' -H "Authorization: Bearer $TOKEN" -X POST $BASE_URL/legal/suggest -H 'Content-Type: application/json' -d '{"narrative":"accused committed theft"}'
echo ""
docker exec sam-postgres-1 psql -U samraksha_user -d samraksha -c "SELECT next_fir_number('00000000-0000-0000-0000-000000000001'::uuid, 2024);"
