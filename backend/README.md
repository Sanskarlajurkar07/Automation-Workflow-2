# Workflow Automation Backend

This is the backend server for the Workflow Automation platform.

## Setup for Public Deployment

For public deployment, follow these steps to ensure users don't need to enter their own API keys:

1. **Environment Setup**
   - Copy `env.example` to `.env` 
   - Configure your MongoDB and other database settings
   - **IMPORTANT**: Set at least one AI service API key (OPENAI_API_KEY recommended)

2. **API Key Management**
   - For public deployment, you should provide a system-wide API key
   - Set `OPENAI_API_KEY` in the `.env` file with your valid OpenAI API key
   - Users can leave the API Key field blank in the OpenAI node to use your system API key

3. **Starting the Server**
   ```bash
   # Install dependencies
   pip install -r requirements.txt
   
   # Start the server
   python main.py
   ```

4. **Customizing Rate Limits**
   If you want to add rate limits for public use, you can modify the code to add:
   - Daily token limits per user
   - Request rate limiting
   - Model access restrictions

## Security Considerations

For public deployments:
1. Never expose your `.env` file
2. Set a strong JWT_SECRET_KEY
3. Enable authentication for all routes
4. Consider adding user quotas to prevent excessive API usage
5. Monitor usage to prevent abuse

## Troubleshooting

If users report no outputs from AI nodes:
1. Check that OPENAI_API_KEY is set in the `.env` file
2. Verify the API key is valid and has sufficient credits
3. Check the logs for any API errors
4. Ensure the networking allows outbound connections to OpenAI servers 