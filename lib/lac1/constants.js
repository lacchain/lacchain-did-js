import { stringToBytes32 } from "../utils.js";

export const LAC1_DID_TYPE_CODE = "0001";
export const LAC1_DID_METHOD_NAME = "lac1";
export const LAC1_DID_DELEGATE_CHANGED_EVENT_NAME = "DIDDelegateChanged";
export const LAC1_DID_ATTRIBUTE_CHANGED_EVENT_NAME = "DIDAttributeChanged";
export const LAC1_DID_AKA_CHANGED_EVENT_NAME = "AKAChanged";
export const LAC1_SIG_AUTH_DELEGATE_TYPE_NAME = "sigAuth";
export const LAC1_VERI_KEY_DELEGATE_TYPE_NAME = "veriKey";
export const LAC1_SIG_AUTH_BYTES32_DELEGATE_TYPE_NAME = stringToBytes32(
  LAC1_SIG_AUTH_DELEGATE_TYPE_NAME
);
export const LAC1_VERI_KEY_BYTES32_DELEGATE_TYPE_NAME = stringToBytes32(
  LAC1_VERI_KEY_DELEGATE_TYPE_NAME
);
