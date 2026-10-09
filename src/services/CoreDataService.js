import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import NFTMarketplace from '../utils/Marketplace.json';
import { ethers } from "ethers";
import web3 from "web3"
import { tokenCookie } from '../hooks/useAuthRedirect';


export const WEBSERVICE = "https://institutional-bo.paybito.com:8443/BrokerAdminApi";
export const BITOHUBWEBSERVICE = "https://institutional-bo.paybito.com:8443/BitohubService";
export const CRYPTOIMAGEURL = 'https://brokersexchange.s3.us-west-1.amazonaws.com/currency_logo';


/*** function defination for showing toast ***/
export const showToast = (type, message) => {
  const Toast = Swal.mixin({
    toast: true,
    position: "bottom-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: false,
    showCloseButton: true,
    didOpen: (toast) => {
      const maxZ = Math.max(
        ...Array.from(
          document.querySelectorAll("body *"),
          (el) => parseFloat(window.getComputedStyle(el).zIndex) || 0
        )
      );
      toast.style.zIndex = maxZ + 10;
    },
    customClass: {
      popup: "custom-toast-width",
    },
  });

  Toast.fire({
    icon: type,
    title: message,
  });
};

/*** function defination for confirm message  ***/
export const swalAlert = (text, type) => {
  Swal.fire({
    // title: title,
    text: text,
    icon: type,
    confirmButtonColor: "#3085d6",
    confirmButtonText: "Ok",
  });

};




/* Function defination to get ipgeo api for lat, long */
export const getLocationData = async () => {
  const ipResponse = await axios.get(`https://api.ipgeolocation.io/ipgeo?apiKey=693da481af1b4a3e80e3dfea9115dc52`);
  return ipResponse;
}

/* Function defination to get user bank details */
export const getUserBankDetails = async (payload) => {
  const response = await axios.post(`https://institutional-bo.paybito.com:8443/BrokerAdminApi/admin/GetUserBankDetails`, payload,
    {
      headers: {
        authorization: `bearer ${tokenCookie.get()}`,
      }
    }
  );
  return response;
}

/* Function defination to get kyc details */
export const getUserKycDetails = async (uuid) => {
  const payload = {
    "uuid": uuid,
  }
  const response = await axios.post(
    `https://institutional-bo.paybito.com:8443/BrokerAdminApi/finance-hub/GetUserDetails?adminUser=${localStorage.getItem('uuid')}`, payload,
    {
      headers: {
        authorization: `bearer ${tokenCookie.get()}`
      }
    }
  );
  return response;
}

/* Method defination to get bitohub user details */
export const getBitoHubUserInfo = async () => {
  const payload = {
    "adminUser": localStorage.getItem('uuid'),
  }
  const response = await axios.post(
    `https://institutional-bo.paybito.com:8443/BrokerAdminApi/bito-hub/users/getBitohubUserExchangeInfo`, payload,
    {
      headers: {
        authorization: `bearer ${tokenCookie.get()}`
      }
    }
  );
  return response;
}
/* Method defination to get bitohub user details */
export const getUserSettings = async () => {
  
  const response = await axios.get(
    `https://institutional-bo.paybito.com:8443/BitohubService/settings?userId=${localStorage.getItem('childUserId')}&pageId=0`,
    {
      headers: {
        authorization: `bearer ${tokenCookie.get()}`
      }
    }
  );
  return response;
}

/* Method defination to get user home currency  details*/
export const getUserHomeCurrency = async (country, brokerId) => {
  const response = await axios.get(
    `https://accounts.paybito.com/api/home/getExchangeFeaturesCurrency/${country}/${brokerId}`,
    {
      headers: {
        authorization: `bearer ${tokenCookie.get()}`
      }
    }
  );
  return response;
}

/* Method defination to get B$ txn charges */
export const getBitoDollarTxnCharge = async (amount, price) => {
  const payload = {
    adminUser: localStorage.getItem('uuid'),
    amount,
    price
  }
  const response = await axios.post(
    `https://institutional-bo.paybito.com:8443/BrokerAdminApi/finance-hub/currencyConversion/txnCharge`,
     payload,
    {
      headers: {
        authorization: `bearer ${tokenCookie.get()}`
      }
    }
  );
  return response;
}

/* method defination for blockchain contract */
export const getBlockChainContract = async () => {
  try {
    if (!window.ethereum) {
      console.error('MetaMask is not installed or not enabled in this browser/incognito mode.');
      return null;
    }

    const Web3 = new web3(window.ethereum);

    const networkId = await Web3.eth.net.getId();
    const networkData = NFTMarketplace.networks[networkId];

    if (!networkData) {
      console.error('Smart contract is not deployed to the detected network.');
      return null;
    }

    const abi = NFTMarketplace.abi;
    const address = networkData.address;

    const contract = new Web3.eth.Contract(abi, address);
    return contract;

  } catch (error) {
    console.error(
      'Error loading blockchain data. Make sure MetaMask is installed and connected.',
      error
    );
    return null;
  }
};


export const fetchCommissionRate = async () => {
  let contract = await getBlockChainContract();
  try {
    const commission = await contract.methods.getCommissionRate().call();
    console.log('Commission..', commission);
    return (commission.toString());
  } catch (error) {
    showSnackbar('Error fetching commission rate' + error, 'error');
    return 0;
  }
};