export function getVerificationEmailHtml(code: string): string {
  const digits = code.split('')

  const digitCells = digits
    .map(
      (d) => `
      <td style="
        width: 48px;
        height: 56px;
        text-align: center;
        vertical-align: middle;
        font-size: 28px;
        font-weight: 700;
        font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
        color: #1a1a2e;
        background-color: #f0f0f5;
        border: 2px solid #e0e0eb;
        border-radius: 8px;
        letter-spacing: 0;
      ">${d}</td>`,
    )
    .join('\n      <td style="width: 8px;"></td>')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verification Code</title>
</head>
<body style="
  margin: 0;
  padding: 0;
  background-color: #f5f5fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5fa;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          max-width: 480px;
          width: 100%;
        ">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 0; text-align: center;">
              <div style="
                width: 56px;
                height: 56px;
                margin: 0 auto 16px;
                background-color: #4f46e5;
                border-radius: 12px;
                line-height: 56px;
                font-size: 24px;
              ">🔐</div>
              <h1 style="
                margin: 0 0 8px;
                font-size: 22px;
                font-weight: 700;
                color: #1a1a2e;
              ">Email Verification</h1>
              <p style="
                margin: 0;
                font-size: 15px;
                color: #6b7280;
                line-height: 1.5;
              ">Enter this code to verify your account</p>
            </td>
          </tr>

          <!-- Code -->
          <tr>
            <td style="padding: 28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  ${digitCells}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Info -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <p style="
                margin: 0;
                font-size: 13px;
                color: #9ca3af;
                text-align: center;
                line-height: 1.6;
              ">
                This code expires in <strong style="color: #6b7280;">10 minutes</strong>.<br />
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="
              padding: 20px 32px;
              border-top: 1px solid #f0f0f5;
              text-align: center;
            ">
              <p style="
                margin: 0;
                font-size: 12px;
                color: #c0c0d0;
              ">Auth Service</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
