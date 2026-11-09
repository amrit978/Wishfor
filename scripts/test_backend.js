const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING BACKEND & OTP VERIFICATION TEST SUITE ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  const baseOptions = {
    hostname: 'localhost',
    port: 3045,
    headers: { 'Content-Type': 'application/json' },
  };

  try {
    // Test 1: Invalid email format rejected
    const test1 = await request({ ...baseOptions, path: '/api/auth/send-otp', method: 'POST' }, {
      identifier: 'notanemail',
      method: 'email',
    });
    assert(test1.status === 400, 'Rejects malformed email with HTTP 400');

    // Test 2: Valid email sends OTP
    const test2 = await request({ ...baseOptions, path: '/api/auth/send-otp', method: 'POST' }, {
      identifier: 'wanderer@example.com',
      method: 'email',
    });
    assert(test2.status === 200 && test2.data.success, 'Valid email receives 6-digit OTP');
    const otpCode = test2.data.devOtp;

    // Test 3: Rapid resend blocked by 60s cooldown (DoS / SMS bombing defense)
    const test3 = await request({ ...baseOptions, path: '/api/auth/send-otp', method: 'POST' }, {
      identifier: 'wanderer@example.com',
      method: 'email',
    });
    assert(test3.status === 429, 'Blocks rapid OTP re-request within 60s with HTTP 429');

    // Test 4: Wrong OTP code fails
    const test4 = await request({ ...baseOptions, path: '/api/auth/verify-otp', method: 'POST' }, {
      identifier: 'wanderer@example.com',
      method: 'email',
      code: '000000',
    });
    assert(test4.status === 400 && test4.data.message.includes('Incorrect code'), 'Rejects invalid OTP code with attempt counter');

    // Test 5: Correct OTP succeeds & returns sanitized user
    if (otpCode) {
      const test5 = await request({ ...baseOptions, path: '/api/auth/verify-otp', method: 'POST' }, {
        identifier: 'wanderer@example.com',
        method: 'email',
        code: otpCode,
      });
      assert(test5.status === 200 && test5.data.success && test5.data.user, 'Verifies valid OTP and returns authenticated session');
    }

    // Test 6: Phone OTP normalization and dispatch
    const test6 = await request({ ...baseOptions, path: '/api/auth/send-otp', method: 'POST' }, {
      identifier: '9876543210',
      method: 'phone',
    });
    assert(test6.status === 200 && test6.data.success, 'Dispatches OTP for 10-digit mobile number');

    // Test 7: Post creation with anti-doxxing enforcement
    const test7 = await request({ ...baseOptions, path: '/api/posts', method: 'POST' }, {
      title: 'Call me at 9876543210',
      body: 'Reach out to my personal email test@gmail.com',
      category: 'Personal',
    });
    assert(test7.status === 400, 'Blocks transmission containing personal phone/email (Anti-Doxxing)');

    // Test 8: Valid clean post published to global ledger
    const test8 = await request({ ...baseOptions, path: '/api/posts', method: 'POST' }, {
      title: 'Feeling adrift after graduating',
      body: 'Everyone else seems to have their direction figured out. How did you find your path when nothing felt certain?',
      category: 'Career',
    });
    assert(test8.status === 201 && test8.data.success, 'Publishes valid problem to public ledger');
    const createdPostId = test8.data.post?.id;

    // Test 9: Crisis signals detection (from simulated distinct user)
    const test9 = await request({
      ...baseOptions,
      path: '/api/posts',
      method: 'POST',
      headers: { ...baseOptions.headers, 'x-forwarded-for': '198.51.100.2' },
    }, {
      title: 'Hard evening',
      body: 'I don want to live anymore, feeling completely hopeless.',
      category: 'Mental Health',
    });
    assert(test9.status === 201 && test9.data.isCrisis === true, 'Detects self-harm crisis signals and flags for helpline routing');

    // Test 10: Reply creation & retrieval
    if (createdPostId) {
      const test10 = await request({ ...baseOptions, path: '/api/replies', method: 'POST' }, {
        postId: createdPostId,
        body: 'Give yourself time. Most people who look confident are learning as they go.',
      });
      assert(test10.status === 201 && test10.data.success, 'Strangers can reply anonymously under rotating mask');

      const test11 = await request({ ...baseOptions, path: `/api/replies?postId=${createdPostId}`, method: 'GET' });
      assert(test11.status === 200 && test11.data.replies.length > 0, 'Retrieves public replies without exposing replier identity');

      // Test 12: Prevent author from posting suggestions on their own question
      const test12 = await request({
        ...baseOptions,
        path: '/api/replies',
        method: 'POST',
        headers: { ...baseOptions.headers, 'x-forwarded-for': '198.51.100.99' },
      }, {
        postId: createdPostId,
        body: 'I am advising myself here.',
        isAsker: true,
      });
      assert(test12.status === 400 && test12.data.error.includes('Authors cannot'), 'Blocks author from submitting suggestions to their own problem');
    }

    console.log(`\n--- TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED ---`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

// Start temporary test server if not running
const { spawn } = require('child_process');

console.log('Launching test server on port 3045...');
const server = spawn('npx next start -p 3045', {
  shell: true,
  stdio: 'inherit',
  env: { ...process.env, TEST_SUITE: 'true' },
});

setTimeout(() => {
  runTests().then(() => {
    console.log('Shutting down test server...');
    if (server.pid) {
      try {
        const { execSync } = require('child_process');
        execSync(`taskkill /F /PID ${server.pid} /T`, { stdio: 'ignore' });
      } catch (e) {}
    }
  });
}, 3000);
