import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { token } = req.body;
  if (!token) return res.status(400).json({ valid: false, error: 'No token' });

  try {
    const secret = process.env.NEXTAUTH_SECRET;
    const parts = token.split('.');

    if (parts.length !== 3) {
      return res.status(401).json({ valid: false, error: 'Invalid token format' });
    }

    const [header, payload, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (expectedSig !== signature) {
      return res.status(401).json({ valid: false, error: 'Invalid signature' });
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && now >= decoded.exp) {
      return res.status(401).json({ valid: false, error: 'Token expired' });
    }

    if (!decoded.isSuperAdmin) {
      return res.status(403).json({ valid: false, error: 'Not a super admin' });
    }

    return res.status(200).json({ valid: true, isSuperAdmin: true, userId: decoded.userId });

  } catch (err) {
    return res.status(401).json({ valid: false, error: 'Verification failed' });
  }
}