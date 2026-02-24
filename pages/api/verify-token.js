import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ valid: false, reason: 'No token provided' });
  }

  try {
    // 1. Split JWT into 3 parts (Header, Payload, Signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(400).json({ valid: false, reason: 'Invalid token format' });
    }

    const [headerBase64url, payloadBase64url, signatureBase64url] = parts;

    // 2. Verify signature (Using base64url to match launch-studio.js)
    const signatureInput = `${headerBase64url}.${payloadBase64url}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.NEXTAUTH_SECRET)
      .update(signatureInput)
      .digest('base64url');

    // Timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(signatureBase64url);
    
    if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
      return res.status(401).json({ valid: false, reason: 'Invalid signature' });
    }

    // 3. Decode and parse payload
    let payload;
    try {
      const decodedPayload = Buffer.from(payloadBase64url, 'base64url').toString('utf-8');
      payload = JSON.parse(decodedPayload);
    } catch (error) {
      return res.status(400).json({ valid: false, reason: 'Invalid payload format' });
    }

    // 4. Check expiration
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && currentTime >= payload.exp) {
      return res.status(401).json({ valid: false, reason: 'Token expired' });
    }

    // 5. Block Super Admins (This endpoint is for normal users only)
    if (payload.isSuperAdmin === true) {
      return res.status(403).json({ valid: false, reason: 'SuperAdmin tokens not allowed on this endpoint' });
    }

    // 6. Check for required user fields
    if (!payload.userId || !payload.paymentId) {
      return res.status(400).json({ valid: false, reason: 'Missing required user/payment data in token' });
    }

    // 7. Token is valid! Return the verified payload
    return res.status(200).json({
      valid: true,
      payload: {
        userId: payload.userId,
        paymentId: payload.paymentId,
        isSuperAdmin: payload.isSuperAdmin
      }
    });

  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({ valid: false, reason: 'Internal server error during verification' });
  }
}