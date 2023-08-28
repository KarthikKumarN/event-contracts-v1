//import all the env constants
import * as dotenv from "dotenv";
dotenv.config();

export const PRIVATE_KEY_MUMBAI = process.env.PRIVATE_KEY_MUMBAI as string;

export const USDC_CONTRACT = process.env.USDC_CONTRACT as string;

export const BUK_WALLET = process.env.BUK_WALLET as string;

export const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY as string;

export const ALCHEMY_MUMBAI_API_KEY = process.env.ALCHEMY_MUMBAI_API_KEY as string;

export const BUK_NFT_NAME = "BukTrips Hotel Bookings"

export const BUK_POS_NFT_NAME = "BukTrips Hotel Bookings - Proof of Stay"