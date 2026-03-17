const sendCustomZeptoEmail = require('./emailConstruct');

const resendVerificationEmail = (details) => {
    const { email, verification_url } = details;
    const currentYear = new Date().getFullYear();
    
    const HTML_content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #F6F8FA;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #FE6349;
        }
        .content {
            margin: 20px 0;
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
        }
        .content p {
            margin: 10px 0;
        }
        .verify-link {
            color: #FE6349;
            text-decoration: none;
            font-weight: bold;
        }
        .footer {
            margin-top: 30px;
            font-size: 14px;
            text-align: center;
            color: #666666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            Heart Board
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>Welcome to Heart Board! Please verify your email address by clicking the link below. This link is valid for the next 1 hour.</p>
            <p><a href="${verification_url}" class="verify-link">Verify your email address</a></p>
            <p>If you didn't create an account with Heart Board, you can safely ignore this email.</p>
            <p>If you have any questions, reach us at <a href="mailto:heartboardapp@gmail.com">heartboardapp@gmail.com</a></p>
        </div>
        <div class="footer">
            &copy; ${currentYear} Heart Board, All rights reserved.
        </div>
    </div>
</body>
</html>
`;

    const subject = "Verify Your Email Address";
    return sendCustomZeptoEmail(email, 'User', subject, HTML_content);
}

module.exports = resendVerificationEmail;