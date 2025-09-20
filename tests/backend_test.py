import requests
import sys
import json
from datetime import datetime

class BeautyDropshipAPITester:
    def __init__(self, base_url="https://beauty-dropship-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.product_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list) and len(response_data) > 0:
                        print(f"   Response: {len(response_data)} items returned")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_initialize_products(self):
        """Test product initialization"""
        return self.run_test("Initialize Products", "POST", "init-products", 200)

    def test_get_all_products(self):
        """Test getting all products"""
        success, response = self.run_test("Get All Products", "GET", "products", 200)
        if success and isinstance(response, list):
            self.product_ids = [product['id'] for product in response if 'id' in product]
            print(f"   Found {len(self.product_ids)} products")
        return success, response

    def test_get_featured_products(self):
        """Test getting featured products"""
        return self.run_test("Get Featured Products", "GET", "products", 200, params={"featured": True})

    def test_get_products_by_category(self):
        """Test filtering products by category"""
        categories = ["skincare", "lips", "eyes", "tools"]
        for category in categories:
            success, response = self.run_test(f"Get {category.title()} Products", "GET", "products", 200, params={"category": category})
            if not success:
                return False, {}
        return True, {}

    def test_get_products_by_skin_type(self):
        """Test filtering products by skin type"""
        skin_types = ["dry", "oily", "sensitive", "combination"]
        for skin_type in skin_types:
            success, response = self.run_test(f"Get Products for {skin_type.title()} Skin", "GET", "products", 200, params={"skin_type": skin_type})
            if not success:
                return False, {}
        return True, {}

    def test_get_products_by_price_range(self):
        """Test filtering products by price range"""
        return self.run_test("Get Products $20-$40", "GET", "products", 200, params={"min_price": 20, "max_price": 40})

    def test_get_single_product(self):
        """Test getting a single product by ID"""
        if not self.product_ids:
            print("❌ No product IDs available for testing")
            return False, {}
        
        product_id = self.product_ids[0]
        return self.run_test("Get Single Product", "GET", f"products/{product_id}", 200)

    def test_get_nonexistent_product(self):
        """Test getting a non-existent product"""
        return self.run_test("Get Non-existent Product", "GET", "products/nonexistent-id", 404)

    def test_cart_operations(self):
        """Test cart CRUD operations"""
        if not self.product_ids:
            print("❌ No product IDs available for cart testing")
            return False

        # Clear cart first
        self.run_test("Clear Cart", "DELETE", "cart", 200)

        # Get empty cart
        success, response = self.run_test("Get Empty Cart", "GET", "cart", 200)
        if not success:
            return False

        # Add item to cart
        product_id = self.product_ids[0]
        success, response = self.run_test("Add to Cart", "POST", "cart", 200, 
                                        data={"product_id": product_id, "quantity": 2})
        if not success:
            return False

        cart_item_id = response.get('id') if response else None
        if not cart_item_id:
            print("❌ No cart item ID returned")
            return False

        # Get cart with items
        success, response = self.run_test("Get Cart with Items", "GET", "cart", 200)
        if not success:
            return False

        # Add same item again (should update quantity)
        success, response = self.run_test("Add Same Item Again", "POST", "cart", 200, 
                                        data={"product_id": product_id, "quantity": 1})
        if not success:
            return False

        # Update cart item quantity
        success, response = self.run_test("Update Cart Item", "PUT", f"cart/{cart_item_id}", 200, 
                                        params={"quantity": 5})
        if not success:
            return False

        # Remove item from cart
        success, response = self.run_test("Remove from Cart", "DELETE", f"cart/{cart_item_id}", 200)
        if not success:
            return False

        return True

    def test_cart_with_invalid_product(self):
        """Test adding non-existent product to cart"""
        return self.run_test("Add Invalid Product to Cart", "POST", "cart", 404, 
                           data={"product_id": "invalid-id", "quantity": 1})

    def test_newsletter_subscription(self):
        """Test newsletter subscription"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        
        # Subscribe to newsletter
        success, response = self.run_test("Subscribe to Newsletter", "POST", "newsletter", 200, 
                                        data={"email": test_email})
        if not success:
            return False

        # Try to subscribe same email again (should fail)
        success, response = self.run_test("Duplicate Newsletter Subscription", "POST", "newsletter", 400, 
                                        data={"email": test_email})
        return success

    def test_create_product(self):
        """Test creating a new product"""
        new_product = {
            "name": "Test Product",
            "description": "A test product for API testing",
            "short_description": "Test product",
            "price": 25.99,
            "category": "skincare",
            "skin_types": ["dry", "oily"],
            "ingredients": ["Test Ingredient"],
            "tags": ["Test"],
            "image_url": "https://example.com/test.jpg"
        }
        return self.run_test("Create Product", "POST", "products", 200, data=new_product)

def main():
    print("🧪 Starting Beauty Dropship API Tests")
    print("=" * 50)
    
    tester = BeautyDropshipAPITester()
    
    # Test sequence
    tests = [
        ("API Root", tester.test_root_endpoint),
        ("Initialize Products", tester.test_initialize_products),
        ("Get All Products", tester.test_get_all_products),
        ("Get Featured Products", tester.test_get_featured_products),
        ("Get Products by Category", tester.test_get_products_by_category),
        ("Get Products by Skin Type", tester.test_get_products_by_skin_type),
        ("Get Products by Price Range", tester.test_get_products_by_price_range),
        ("Get Single Product", tester.test_get_single_product),
        ("Get Non-existent Product", tester.test_get_nonexistent_product),
        ("Cart Operations", tester.test_cart_operations),
        ("Cart with Invalid Product", tester.test_cart_with_invalid_product),
        ("Newsletter Subscription", tester.test_newsletter_subscription),
        ("Create Product", tester.test_create_product),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            success = test_func()
            if isinstance(success, tuple):
                success = success[0]
            if not success:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print final results
    print(f"\n{'='*50}")
    print(f"📊 FINAL RESULTS")
    print(f"{'='*50}")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print(f"\n✅ All tests passed!")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())