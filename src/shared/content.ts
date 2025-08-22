export const countryConfig = {
  BD: {
    country: "Bangladesh",
    currencyCode: "BDT",
    currencyName: "Bangladeshi Taka",
    paymentMethods: ["Credit Card", "bKash", "Nagad"],
  },
  JM: {
    country: "Jamaica",
    currencyCode: "JMD",
    currencyName: "Jamaican Dollar",
    paymentMethods: ["card", "local_bank_transfer"],
  },
  IN: {
    country: "India",
    currencyCode: "INR",
    currencyName: "Indian Rupee",
    paymentMethods: ["card", "upi_inr", "bank_transfer"],
  },
  US: {
    country: "United States",
    currencyCode: " ",
    currencyName: "United States Dollar",
    paymentMethods: ["Credit Card", "ACH", "Bank Transfer"],
  },
};

export type CountryCode = "BD" | "JM" | "IN" | "US";
