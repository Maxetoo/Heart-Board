var { SendMailClient } = require("zeptomail");

const url = "https://api.zeptomail.com/v1.1/email";
const token = process.env.ZOHO_API_KEY;

let client = new SendMailClient({url, token}); 

const sendCustomZeptoEmail = async(to, name, subject, HTML_content) => {
    return client.sendMail({
        "from": 
        {
            "address": "info@heartboardapp.com",
            "name": "Heart Board"
        },
        "to": 
        [
            {
            "email_address": 
                {
                    "address": `${to}`,
                    "name": `${name}`
                }
            }
        ],
        "subject": `${subject}`,
        "htmlbody": `${HTML_content}`,
    }).then((resp) => console.log("success")).catch((error) => console.log("error"));
}

module.exports = sendCustomZeptoEmail