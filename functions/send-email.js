const axios = require('axios');

exports.handler = async function (event, context) {
  // Define CORS headers to allow all origins
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Allows all origins (http and https)
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse the request body
    const { email, verificationLink, tokenExpirationHours } = JSON.parse(event.body);

    // Validate required fields
    if (!email || !verificationLink || !tokenExpirationHours) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // SendGrid API request
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [
          {
            to: [{ email }],
          },
        ],
        from: {
          email: process.env.SENDER_EMAIL,
          name: process.env.SENDER_NAME,
        },
        subject: 'Verify Your Email - RunConnect',
        content: [
          {
            type: 'text/html',
            value: `
              <h2>Welcome to RunConnect!</h2>
              <p>Thank you for signing up. Please click the link below to verify your email address:</p>
              <p><a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
              <p>Or copy and paste this link in your browser:</p>
              <p>${verificationLink}</p>
              <p>This link will expire in ${tokenExpirationHours} hours.</p>
              <p>If you didn't create an account, please ignore this email.</p>
            `,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Email sent successfully' }),
    };
  } catch (error) {
    console.error('SendGrid API error:', error.response ? error.response.data : error.message);
    return {
      statusCode: error.response ? error.response.status : 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to send verification email' }),
    };
  }
};
