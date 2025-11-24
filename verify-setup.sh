#!/bin/bash
# Pre-Deployment Verification Script
# Run this to verify all files are in place

echo "🔍 Verifying Netlify Setup..."
echo ""

# Check netlify.toml
if [ -f "netlify.toml" ]; then
    echo "✅ netlify.toml exists"
else
    echo "❌ netlify.toml missing"
fi

# Check .netlifyignore
if [ -f ".netlifyignore" ]; then
    echo "✅ .netlifyignore exists"
else
    echo "❌ .netlifyignore missing"
fi

# Check functions
echo ""
echo "Checking functions..."
if [ -f "netlify/functions/orders.js" ]; then
    echo "✅ netlify/functions/orders.js exists"
else
    echo "❌ netlify/functions/orders.js missing"
fi

if [ -f "netlify/functions/menu.js" ]; then
    echo "✅ netlify/functions/menu.js exists"
else
    echo "❌ netlify/functions/menu.js missing"
fi

if [ -f "netlify/functions/api.js" ]; then
    echo "✅ netlify/functions/api.js exists"
else
    echo "❌ netlify/functions/api.js missing"
fi

# Check documentation
echo ""
echo "Checking documentation..."
docs=(
    "NETLIFY_DEPLOYMENT.md"
    "NETLIFY_CHECKLIST.md"
    "NETLIFY_FAQ.md"
    "NETLIFY_SETUP_SUMMARY.md"
    "NETLIFY_VISUAL_GUIDE.md"
    "NETLIFY_FILES_INDEX.md"
    "00-START-HERE.md"
    "DEPLOYMENT_READY.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "✅ $doc exists"
    else
        echo "❌ $doc missing"
    fi
done

# Check key configuration
echo ""
echo "Checking configuration..."
if grep -q "/.netlify/functions" services/config.ts; then
    echo "✅ services/config.ts updated for production"
else
    echo "⚠️  services/config.ts may not be updated"
fi

echo ""
echo "✅ Verification complete!"
echo ""
echo "Next steps:"
echo "1. Read: 00-START-HERE.md"
echo "2. Check: NETLIFY_CHECKLIST.md"
echo "3. Follow: NETLIFY_DEPLOYMENT.md"
