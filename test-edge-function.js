// Test script for Edge Function integration
// Run with: node test-edge-function.js

const SUPABASE_FUNCTIONS_URL = "https://xbrtqfisytoamfvdmqkp.functions.supabase.co";
const FUNCTION_URL = `${SUPABASE_FUNCTIONS_URL}/watermark-pdf`;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

// Test URL parsing logic
function testUrlParsing() {
  console.log("=== Testing URL Parsing ===");
  
  const testCases = [
    {
      input: `edge-function:${FUNCTION_URL}:https://example.com/test.pdf`,
      expected: {
        functionUrl: FUNCTION_URL,
        s3Key: "https://example.com/test.pdf"
      }
    },
    {
      input: `edge-function:${FUNCTION_URL}:topic/file.pdf`,
      expected: {
        functionUrl: FUNCTION_URL,
        s3Key: "topic/file.pdf"
      }
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}:`);
    console.log(`Input: ${testCase.input}`);
    
    // Simulate the parsing logic
    const content = testCase.input.replace("edge-function:", "");
    const watermarkPdfIndex = content.indexOf("/watermark-pdf");
    
    if (watermarkPdfIndex !== -1) {
      const functionUrlEnd = watermarkPdfIndex + "/watermark-pdf".length;
      if (functionUrlEnd < content.length && content[functionUrlEnd] === ":") {
        const parsed = {
          functionUrl: content.substring(0, functionUrlEnd),
          s3Key: content.substring(functionUrlEnd + 1)
        };
        
        console.log(`Parsed:`, parsed);
        console.log(`Expected:`, testCase.expected);
        
        if (parsed.functionUrl === testCase.expected.functionUrl && 
            parsed.s3Key === testCase.expected.s3Key) {
          console.log("✅ PASS");
        } else {
          console.log("❌ FAIL");
        }
      }
    }
  });
}

// Test Edge Function CORS (OPTIONS request)
async function testCORS() {
  console.log("\n=== Testing CORS (OPTIONS) ===");
  
  try {
    const response = await fetch(FUNCTION_URL, {
      method: "OPTIONS",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.status === 200 || response.status === 204) {
      console.log("✅ CORS preflight successful");
    } else {
      console.log("❌ CORS preflight failed");
    }
  } catch (error) {
    console.error("❌ Error testing CORS:", error.message);
  }
}

// Test Edge Function with a sample request
async function testEdgeFunction() {
  console.log("\n=== Testing Edge Function (POST) ===");
  
  // Use a sample PDF URL for testing
  const testPdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
  
  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "", // Empty for public mode
        "apikey": SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        pdfUrl: testPdfUrl,
        watermarkText: "StudyBoards - Confidential"
      })
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get("Content-Type")}`);
    
    if (response.ok) {
      const blob = await response.blob();
      console.log(`✅ Success! Received PDF blob: ${blob.size} bytes`);
      console.log(`Blob type: ${blob.type}`);
      
      if (blob.type === "application/pdf") {
        console.log("✅ Correct content type (application/pdf)");
      } else {
        console.log(`⚠️  Unexpected content type: ${blob.type}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Error response: ${errorText}`);
    }
  } catch (error) {
    console.error("❌ Error testing Edge Function:", error.message);
  }
}

// Run all tests
async function runTests() {
  console.log("🧪 Testing Edge Function Integration\n");
  console.log(`Function URL: ${FUNCTION_URL}\n`);
  
  testUrlParsing();
  await testCORS();
  await testEdgeFunction();
  
  console.log("\n✅ Tests completed!");
}

// Check if running in Node.js environment
if (typeof fetch === 'undefined') {
  console.log("⚠️  This script requires Node.js 18+ with native fetch support");
  console.log("   Or install node-fetch: npm install node-fetch");
  process.exit(1);
}

runTests().catch(console.error);
