// Daraja requires a callback URL and expects an acknowledgement. Payment state is read back
// through api/mpesa-status.js (a stateless query), so this only acknowledges.
export default function handler(_req, res) {
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
