const axios = require("axios");
const fs = require("fs");

const URL = "https://sandbox.api-setu.in/certificate/v3/upenergy/elebl";

async function testUPenergyAPI() {
  try {
    const payload = {
      txnId: crypto.randomUUID(),
      format: "xml",
      certificateParameters: {
        AccountNo: "ACTUAL_VALID_ACCOUNT",
        Discom: "PuVVNL"
      },
      consentArtifact: {
        consent: {
          consentId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          dataConsumer: { id: "in.gov.sandbox" },
          dataProvider: { id: "UPENERGY" },
          purpose: { description: "Testing UP Energy Bill API" },
          user: {
            idType: "mobile",
            idNumber: "9988776655",
            mobile: "9988776655",
            email: "test@email.com"
          },
          data: { id: "energy" },
          permission: {
            access: "READ",
            dateRange: {
              from: new Date().toISOString(),
              to: new Date().toISOString()
            },
            frequency: { unit: "once", value: 1, repeats: 0 }
          }
        },
        signature: {
          signature: "BASE64_ENCODED_SIGNATURE"
        }
      }
    };
    

    const res = await axios.post(URL, payload, {
      responseType: "text", // because UP returns XML text, NOT PDF
      headers: {
        Accept: "application/xml",
        "Content-Type": "application/json",
        "X-APISETU-APIKEY": "demokey123456ABCD789",
        "X-APISETU-CLIENTID": "in.gov.sandbox"
      }
    });

    fs.writeFileSync("up_energy_response.xml", res.data);

    console.log("✔ XML saved to up_energy_response.xml");
  } catch (err) {
    console.error("❌ API Error:");
    console.log(err.response?.data || err.message);
  }
}

testUPenergyAPI();
