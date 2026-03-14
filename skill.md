# LUMINA: OTP Message Listener Skill

This skill allows the Trae AI Agent to securely monitor the backend terminal logs for generated One-Time Passwords (OTPs) when real-world delivery (Email/SMS) is in "Dev Mode" or fails.

## Capabilities
- **Monitor Backend Logs**: Listen for `LUMINA DEV MODE` tags in the terminal output.
- **Regex Extraction**: Use `\b\d{6}\b` to parse 6-digit OTP codes from message bodies.
- **Real-time Assistance**: Provide the extracted OTP to the user immediately upon request.

## How to use this Skill
When the user says: "I didn't get the OTP" or "@sms_agent check latest OTP", the AI should:
1. Run `CheckCommandStatus` on the server terminal.
2. Search for the pattern: `LUMINA DEV MODE: OTP for [target] is [[0-9]{6}]`.
3. Extract the 6-digit code.
4. Inform the user: "I've detected your secure OTP from the internal ledger: [OTP]. Please enter it to continue."

## Security Note
This skill is strictly for the LUMINA development environment and should be replaced by a secure, direct API integration (like Twilio or Gmail SMTP) in production.
