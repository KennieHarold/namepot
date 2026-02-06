import * as yup from "yup";
import { isAddress } from "viem";

const ethereumAddress = yup
  .string()
  .required("This field is required")
  .test("is-address", "Must be a valid Ethereum address", (value) =>
    isAddress(value ?? ""),
  );

export const createPotSchema = yup.object({
  label: yup.string().trim().required("Pot name is required"),
  quorum: yup
    .number()
    .oneOf([500, 750, 1000], "Select a quorum option")
    .required("Quorum is required"),
  deadline: yup
    .string()
    .required("Deadline is required")
    .test("is-future", "Deadline must be in the future", (value) => {
      if (!value) return false;
      return new Date(value).getTime() > Date.now();
    }),
  recipient: ethereumAddress.label("Recipient address"),
  goal: yup
    .string()
    .required("Goal is required")
    .test("positive", "Goal must be greater than 0", (value) => {
      if (!value) return false;
      return Number(value) > 0;
    }),
  tokenAddress: ethereumAddress.label("Token address").required(),
});
