async function testAddProduct() {
  const testProduct = {
    name: "Test Honey Product",
    description: "A test honey product",
    price: 75.5
  };

  try {
    console.log('Testing add product API...');
    console.log('Sending data:', JSON.stringify(testProduct, null, 2));
    
    const response = await fetch('http://localhost:3001/api/menu/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testProduct)
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    console.log('Response body:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Success! Product added:', data);
    } else {
      console.log('❌ Error:', response.status, responseText);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testAddProduct();