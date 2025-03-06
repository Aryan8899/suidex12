"use client";

import { useState, useEffect } from "react";
import "@mysten/dapp-kit/dist/index.css";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import TokenSelector from "./token-selector";
import { Transaction } from "@mysten/sui/transactions";
// import { toast } from "react-hot-toast";
import { CONSTANTS } from "../constants/addresses";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import axios from "axios";

interface Token {
  id: string; // The token ID is a string
  name: string;
  symbol: string;
  decimals: number;
}

// interface LPEvent {
//   sender: string;
//   lp_coin_id: string;
//   token0_type: string;
//   token1_type: string;
//   amount0: string;
//   amount1: string;
//   liquidity: string;
//   total_supply: string;
// }

interface LPEvent {
  type: string;
  sender: string;
  lpCoinId: string;
  token0Type: { name: string };
  token1Type: { name: string };
  amount0: string;
  amount1: string;
  liquidity: string;
  totalSupply: string;
  //   timestamp: string;
}
// interface ParsedEventJson {
//   pair: string;
//   token0: Token;
//   token1: Token;
// }

const formatTokenAmount = (amount: string, decimals: number) => {
  const formattedAmount = Number(amount) / Math.pow(10, decimals);
  return formattedAmount.toFixed(3); // Always show 3 decimal places for consistency
};
export default function MainCon() {
  const [amount1, setAmount1] = useState<string>("");
  // const [checkTrigger, setCheckTrigger] = useState(0);
  // const [amount2, setAmount2] = useState<string>("0.0");
  const [priceRate0, setPriceRate0] = useState<string | null>(null);
  const [priceRate1, setPriceRate1] = useState<string | null>(null);
  const [suggestedAmount1, setSuggestedAmount1] = useState<string | null>(null);
  const [token0, setToken0] = useState<Token | null>(null);
  const [token1, setToken1] = useState<Token | null>(null);
  const [amount0, setAmount0] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [balance0, setBalance0] = useState("0");
  const [balance1, setBalance1] = useState("0");
  const [pairExists, setPairExists] = useState(false);
  const [currentPairId, setCurrentPairId] = useState<string | null>(null);
  const [reserves, setReserves] = useState({
    reserve0: "0",
    reserve1: "0",
    timestamp: 0,
  });

  // Reset when changing tabs
  const [suggestedLiquidityAmount, setSuggestedLiquidityAmount] = useState<
    string | null
  >(null);
  // Calculate the suggested liquidity amount based on reserves ratio
  const calculateSuggestedLiquidityAmount = (
    amount: string,
    token0: Token | null,
    token1: Token | null
  ): string | null => {
    if (
      !pairExists ||
      !amount ||
      !token0 ||
      !token1 ||
      reserves.reserve0 === "0" ||
      reserves.reserve1 === "0"
    ) {
      return null;
    }

    try {
      // Convert input amount to the smallest unit using token0's decimals
      const inputAmountSmallestUnit =
        parseFloat(amount) * Math.pow(10, token0.decimals);

      // Convert reserves to their actual values considering decimals
      const reserve0Actual =
        Number(reserves.reserve0) / Math.pow(10, token0.decimals);
      const reserve1Actual =
        Number(reserves.reserve1) / Math.pow(10, token1.decimals);

      // Calculate the ratio and suggested amount
      const ratio = reserve1Actual / reserve0Actual;
      const suggestedAmount = parseFloat(amount) * ratio;

      console.log("Calculation details:", {
        inputAmount: amount,
        inputAmountSmallestUnit,
        reserve0Actual,
        reserve1Actual,
        ratio,
        suggestedAmount,
      });

      return suggestedAmount.toFixed(3);
    } catch (error) {
      console.error("Error calculating suggested amount:", error);
      return null;
    }
  };
  // Reset relevant values when changing tokens
  const handleToken0Change = (newToken: Token | null) => {
    setAmount0("");
    setAmount1("");
    setPriceRate0(null);
    setPriceRate1(null);
    setSuggestedLiquidityAmount(null);
    setSuggestedAmount1(null);
    setBalance0("0");
    setPairExists(false);
    setCurrentPairId(null);

    setReserves({
      reserve0: "0",
      reserve1: "0",
      timestamp: 0,
    });
    setToken0(newToken);
  };

  const handleToken1Change = (newToken: Token | null) => {
    setAmount0("");
    setAmount1("");
    setPriceRate0(null);
    setPriceRate1(null);
    setSuggestedAmount1(null);
    setBalance1("0");
    setSuggestedLiquidityAmount(null);
    setPairExists(false);
    setCurrentPairId(null);
    setReserves({
      reserve0: "0",
      reserve1: "0",
      timestamp: 0,
    });
    setToken1(newToken);
  };

  // const [liquidityAmount1, setLiquidityAmount1] = useState("0.0");
  // const [liquidityAmount2, setLiquidityAmount2] = useState("0.0");

  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  useEffect(() => {
    if (!window.suiWallet) {
      console.warn("Sui Wallet is not installed.");
    } else {
      console.log("Sui Wallet is available.");
      window.suiWallet
        .getAccounts()
        .then((accounts) => {
          console.log("Accounts available:", accounts);
        })
        .catch((error) => {
          console.error("Error fetching accounts:", error);
        });
    }
  }, []);

  // Fetch balance for a given token with the token's decimals
  useEffect(() => {
    const fetchBalance = async (
      token: Token | null, // Pass token object that contains decimals
      setBalance: (val: string) => void
    ) => {
      if (!token?.id || !account?.address) return;
      try {
        const coin = await suiClient.getObject({
          id: token.id, // Assuming token's name or ID is the token ID in this case
          options: { showContent: true },
        });

        // Add type guards to check the structure of the response
        if (
          coin.data?.content &&
          "fields" in coin.data.content &&
          typeof coin.data.content.fields === "object" &&
          coin.data.content.fields &&
          "balance" in coin.data.content.fields
        ) {
          const balance = coin.data.content.fields.balance as string;
          console.log("Balance:", balance);
          // Format the balance with the token's decimals
          setBalance(formatTokenAmount(balance, token.decimals));
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };
    console.log("Token0:", token0);
    console.log("Token1:", token1);

    if (token0) fetchBalance(token0, setBalance0);
    if (token1) fetchBalance(token1, setBalance1);
  }, [token0, token1, account?.address, suiClient]);
  useEffect(() => {
    const calculateRates = () => {
      if (
        reserves.reserve0 === "0" ||
        reserves.reserve1 === "0" ||
        !token0 ||
        !token1
      ) {
        setPriceRate0(null);
        setPriceRate1(null);
        return;
      }

      // Convert reserves to their actual values considering decimals
      const reserve0Actual =
        Number(reserves.reserve0) / Math.pow(10, token0.decimals);
      const reserve1Actual =
        Number(reserves.reserve1) / Math.pow(10, token1.decimals);

      // Calculate price rates (1 token0 = X token1 and vice versa)
      const rate0 = (reserve1Actual / reserve0Actual).toFixed(6);
      const rate1 = (reserve0Actual / reserve1Actual).toFixed(6);

      console.log("Price calculations:", {
        reserve0: reserves.reserve0,
        reserve1: reserves.reserve1,
        token0Decimals: token0.decimals,
        token1Decimals: token1.decimals,
        reserve0Actual,
        reserve1Actual,
        rate0,
        rate1,
      });

      setPriceRate0(rate0);
      setPriceRate1(rate1);
    };

    calculateRates();
  }, [reserves, token0, token1]);
  useEffect(() => {
    const suggestAmount = () => {
      if (amount0 && priceRate0 && reserves.reserve0 !== "0") {
        const suggested = (Number(amount0) * Number(priceRate0)).toFixed(3);
        console.log("Suggested amount:", suggested);
        setSuggestedAmount1(suggested);
        console.log("Suggested amount:", suggestedAmount1);
      } else {
        setSuggestedAmount1(null);
      }
    };

    suggestAmount();
  }, [amount0, priceRate0]);

  // Check pair existence function
  useEffect(() => {
    const checkPairExistence = async () => {
      if (!token0 || !token1) return;
      try {
        console.log("Checking pair existence for tokens:", { token0, token1 });

        const token0Id = token0.id;
        const token1Id = token1.id;

        const [token0Obj, token1Obj] = await Promise.all([
          suiClient.getObject({ id: token0Id, options: { showType: true } }),
          suiClient.getObject({ id: token1Id, options: { showType: true } }),
        ]);

        const getBaseType = (coinType: any) => {
          const match = coinType.match(/<(.+)>/);
          return match ? match[1] : coinType;
        };

        const baseType0 = token0Obj.data?.type
          ? getBaseType(token0Obj.data.type)
          : "";
        const baseType1 = token1Obj.data?.type
          ? getBaseType(token1Obj.data.type)
          : "";

        const tx = new Transaction();
        tx.moveCall({
          target: `${CONSTANTS.PACKAGE_ID}::factory::get_pair`,
          typeArguments: [baseType0, baseType1],
          arguments: [tx.object(CONSTANTS.FACTORY_ID)],
        });

        const response = await suiClient.devInspectTransactionBlock({
          transactionBlock: tx,
          sender: account?.address || "",
        });

        if (response?.results?.[0]?.returnValues) {
          const optionValue = response.results[0].returnValues[0];
          if (Array.isArray(optionValue) && optionValue.length > 0) {
            const addressBytes = optionValue[0];
            if (Array.isArray(addressBytes) && addressBytes.length > 1) {
              const hexString = addressBytes
                .slice(1)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
              const pairId = `0x${hexString}`;

              const pairObject = await suiClient.getObject({
                id: pairId,
                options: {
                  showContent: true,
                  showType: true,
                },
              });

              if (
                pairObject.data?.content &&
                "fields" in pairObject.data.content &&
                typeof pairObject.data.content.fields === "object" &&
                pairObject.data.content.fields &&
                "reserve0" in pairObject.data.content.fields &&
                "reserve1" in pairObject.data.content.fields &&
                "block_timestamp_last" in pairObject.data.content.fields
              ) {
                const fields = pairObject.data.content.fields;

                const isToken0Base = baseType0 < baseType1;
                setReserves({
                  reserve0: isToken0Base
                    ? String(fields.reserve0)
                    : String(fields.reserve1),
                  reserve1: isToken0Base
                    ? String(fields.reserve1)
                    : String(fields.reserve0),
                  timestamp: Number(fields.block_timestamp_last) || 0,
                });
              }
              setPairExists(true);
              setCurrentPairId(pairId);
            } else {
              resetPairState();
            }
          } else {
            resetPairState();
          }
        } else {
          resetPairState();
        }
      } catch (error) {
        console.error("Error during pair check:", error);
        resetPairState();
      }
    };

    checkPairExistence();
  }, [token0, token1, suiClient, account?.address]);

  // Reset pair state helper
  const resetPairState = () => {
    setPairExists(false);
    setCurrentPairId(null);
    setReserves({ reserve0: "0", reserve1: "0", timestamp: 0 });
  };
  const sortTokens = (type0: string, type1: string): [string, string] => {
    if (type0 === type1) {
      throw new Error("Identical tokens");
    }
    const bytes0 = new TextEncoder().encode(type0);
    const bytes1 = new TextEncoder().encode(type1);
    return compareBytes(bytes0, bytes1) ? [type0, type1] : [type1, type0];
  };

  const compareBytes = (a: Uint8Array, b: Uint8Array): boolean => {
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
      if (a[i] !== b[i]) {
        return a[i] < b[i];
      }
    }
    return a.length < b.length;
  };

  // Add this new useEffect
  useEffect(() => {
    const updateLiquidityAmounts = () => {
      if (pairExists && amount0 && token0 && token1) {
        const suggestedAmount = calculateSuggestedLiquidityAmount(
          amount0,
          token0,
          token1
        );
        if (suggestedAmount) {
          setSuggestedLiquidityAmount(suggestedAmount);
          setAmount1(suggestedAmount);
        }
      }
    };

    updateLiquidityAmounts();
  }, [pairExists, amount0, token0, token1]);

  // Modified handleCreatePair function
  const handleCreatePair = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!token0 || !token1) {
      toast.error("Please select both tokens");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Creating new pair...");

    try {
      // Get token objects
      const token0Id = typeof token0 === "string" ? token0 : token0.id;
      const token1Id = typeof token1 === "string" ? token1 : token1.id;

      const [token0Obj, token1Obj] = await Promise.all([
        suiClient.getObject({ id: token0Id, options: { showType: true } }),
        suiClient.getObject({ id: token1Id, options: { showType: true } }),
      ]);

      if (!token0Obj?.data?.type || !token1Obj?.data?.type) {
        throw new Error("Invalid token types");
      }

      // Get base types
      const getBaseType = (coinType: string) => {
        const match = coinType.match(/<(.+)>/);
        return match ? match[1] : coinType;
      };

      const baseType0 = getBaseType(token0Obj.data.type);
      const baseType1 = getBaseType(token1Obj.data.type);

      // Sort token types
      const [sortedType0, sortedType1] = sortTokens(baseType0, baseType1);

      // Create the pair transaction
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.ROUTER}::create_pair`,
        arguments: [
          tx.object(CONSTANTS.ROUTER_ID),
          tx.object(CONSTANTS.FACTORY_ID),
          tx.pure.string(sortedType0.split("::").pop() || ""),
          tx.pure.string(sortedType1.split("::").pop() || ""),
        ],
        typeArguments: [sortedType0, sortedType1],
      });
      console.log("Simulating Create pair...");
      const simulationResult = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: account.address,
      });

      console.group("📊 Simulation Results");
      console.log("Effects:", simulationResult.effects);
      if (simulationResult.effects?.status?.error) {
        console.error(
          "Simulation Error:",
          simulationResult.effects.status.error
        );
        throw new Error(
          `Simulation Error: ${simulationResult.effects.status.error}`
        );
      }
      console.groupEnd();

      // Execute the transaction
      await signAndExecute(
        { transaction: tx },
        {
          onSuccess: async () => {
            toast.update(toastId, {
              render: "Pair Created Successfully",
              type: "success",
              isLoading: false,
              autoClose: 5000,
            });

            // Check for pair existence after successful creation
            try {
              const token0Id = token0?.id;
              const token1Id = token1?.id;

              const [token0Obj, token1Obj] = await Promise.all([
                suiClient.getObject({
                  id: token0Id!,
                  options: { showType: true },
                }),
                suiClient.getObject({
                  id: token1Id!,
                  options: { showType: true },
                }),
              ]);

              const getBaseType = (coinType: string) => {
                const match = coinType.match(/<(.+)>/);
                return match ? match[1] : coinType;
              };

              const baseType0 = getBaseType(token0Obj.data?.type || "");
              const baseType1 = getBaseType(token1Obj.data?.type || "");

              const tx = new Transaction();
              tx.moveCall({
                target: `${CONSTANTS.PACKAGE_ID}::factory::get_pair`,
                typeArguments: [baseType0, baseType1],
                arguments: [tx.object(CONSTANTS.FACTORY_ID)],
              });

              const response = await suiClient.devInspectTransactionBlock({
                transactionBlock: tx,
                sender: account?.address || "",
              });

              if (response?.results?.[0]?.returnValues) {
                const optionValue = response.results[0].returnValues[0];
                if (Array.isArray(optionValue) && optionValue.length > 0) {
                  const addressBytes = optionValue[0];
                  if (Array.isArray(addressBytes) && addressBytes.length > 1) {
                    const hexString = addressBytes
                      .slice(1)
                      .map((b) => b.toString(16).padStart(2, "0"))
                      .join("");
                    const pairId = `0x${hexString}`;

                    const pairObject = await suiClient.getObject({
                      id: pairId,
                      options: {
                        showContent: true,
                        showType: true,
                      },
                    });

                    if (
                      pairObject.data?.content &&
                      "fields" in pairObject.data.content &&
                      typeof pairObject.data.content.fields === "object" &&
                      pairObject.data.content.fields &&
                      "reserve0" in pairObject.data.content.fields &&
                      "reserve1" in pairObject.data.content.fields &&
                      "block_timestamp_last" in pairObject.data.content.fields
                    ) {
                      const fields = pairObject.data.content.fields;

                      setReserves({
                        reserve0: fields.reserve0 as string,
                        reserve1: fields.reserve1 as string,
                        timestamp: fields.block_timestamp_last as number,
                      });
                    }

                    setPairExists(true);
                    setCurrentPairId(pairId);
                  } else {
                    resetPairState();
                  }
                } else {
                  resetPairState();
                }
              } else {
                resetPairState();
              }
            } catch (error) {
              console.error(
                "Error checking pair existence after creation:",
                error
              );
              resetPairState();
            }
          },

          onError: (error) => {
            if (error.message.includes("308")) {
              toast.error("This pair already exists", { toastId });
            } else {
              toast.error(`Failed to create pair: ${error.message}`, {
                toastId,
              });
            }
          },
        }
      );
    } catch (error: any) {
      console.error("Pair creation failed:", error);
      let errorMessage = error.message || "Unknown error";

      if (errorMessage.includes("308")) {
        errorMessage = "Trading pair already exists";
      }
      toast.error(errorMessage, { toastId });
    } finally {
      setIsLoading(false);
    }
  };
  const [events, setEvents] = useState<any[]>([]);

  // Update useEffect for event fetching
  useEffect(() => {
    const fetchEvents = async () => {
      if (!account?.address) return;

      try {
        const recentTxs = await suiClient.queryEvents({
          query: { MoveEventType: `${CONSTANTS.PACKAGE_ID}::pair::LPMint` },
          order: "descending",
          limit: 10,
        });

        console.log("Raw events:", recentTxs.data[0].parsedJson);

        const processedEvents = recentTxs.data.map((event) => {
          const parsed = event.parsedJson as any;
          const processed = {
            type: event.type,
            sender: parsed.sender,
            lpCoinId: parsed.lpCoinId,
            token0Type: parsed.token0Type,
            token1Type: parsed.token1Type,
            amount0: parsed.amount0,
            amount1: parsed.amount1,
            liquidity: parsed.liquidity,
            totalSupply: parsed.totalSupply,
            pairId: currentPairId, // Add the current pair ID
            transactionHash: event.id.txDigest, // Add the transaction hash
            packageId: parsed.Package_id || CONSTANTS.PACKAGE_ID
            // timestamp: event.timestampMs,
          };
          console.log("Processed event:", processedEvents);
          // Store events in database
          return processed;
        });

        setEvents(processedEvents);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchEvents();
  }, [account?.address, suiClient]);
  // Add processLPEvent function inside the MainCon component
  const processLPEvent = async (txDigest: string) => {
    try {
      console.log("Processing LP events for transaction:", txDigest);

      const txData = await suiClient.getTransactionBlock({
        digest: txDigest,
        options: {
          showEvents: true,
          showEffects: true,
        },
      });

      type LPEventJson = {
        sender: string;
        lp_coin_id: string;
        token0_type: string;
        token1_type: string;
        amount0: string;
        amount1: string;
        liquidity: string;
        total_supply: string;
        packageId?: string;
      };

      const lpEvents = txData.events
        ?.filter((event) => event.type.includes("::pair::LP"))
        .map((event) => ({
          type: event.type,
          sender: (event.parsedJson as LPEventJson).sender,
          lpCoinId: (event.parsedJson as LPEventJson).lp_coin_id,
          token0Type: (event.parsedJson as LPEventJson).token0_type,
          token1Type: (event.parsedJson as LPEventJson).token1_type,
          amount0: (event.parsedJson as LPEventJson).amount0,
          amount1: (event.parsedJson as LPEventJson).amount1,
          liquidity: (event.parsedJson as LPEventJson).liquidity,
          totalSupply: (event.parsedJson as LPEventJson).total_supply,
          pairId: currentPairId, // Add the current pair ID
          packageId: (event.parsedJson as LPEventJson).packageId || CONSTANTS.PACKAGE_ID,
          timestamp: new Date().toISOString(),
          transactionHash: txDigest, // Add the transaction hash
        }));

      setEvents(lpEvents || []);
      console.log("Processed LP events:", lpEvents);
      try {
        const response = await fetch(
          "https://dexback-mu.vercel.app/api/lpcoin",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(lpEvents),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to store LP events");
        }
        console.log("Successfully stored LP events in database");
      } catch (error) {
        console.error("Error storing LP events:", error);
      }
      return lpEvents;
    } catch (error) {
      console.error("Error processing LP events:", error);
      throw error;
    }
  };

  // Function to add liquidity (requires amounts and existing pair)
  const handleAddLiquidity = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!token0 || !token1 || !amount0 || !amount1 || !currentPairId) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Adding liquidity...");

    try {
      // Get token IDs correctly depending on whether token0/token1 are strings or Token objects
      const token0Id = typeof token0 === "string" ? token0 : token0?.id;
      const token1Id = typeof token1 === "string" ? token1 : token1?.id;

      if (!token0Id || !token1Id) {
        throw new Error("Token IDs are missing or invalid");
      }

      const [token0Obj, token1Obj] = await Promise.all([
        suiClient.getObject({ id: token0Id, options: { showType: true } }),
        suiClient.getObject({ id: token1Id, options: { showType: true } }),
      ]);

      if (!token0Obj?.data || !token1Obj?.data) {
        throw new Error("Failed to retrieve token data");
      }

      const getBaseType = (coinType: string | null | undefined): string => {
        if (!coinType) {
          throw new Error("Coin type is undefined or null");
        }
        const match = coinType.match(/<(.+)>/);
        return match ? match[1] : coinType;
      };

      const baseType0 = getBaseType(token0Obj.data.type);
      const baseType1 = getBaseType(token1Obj.data.type);

      const [sortedType0, sortedType1] = sortTokens(baseType0, baseType1);

      const needToSwap = sortedType0 !== baseType0;
      console.log("Token sort check:", {
        needToSwap,
        original: { baseType0, baseType1 },
        sorted: { sortedType0, sortedType1 },
      });

      // Get token decimals
      // const getTokenDecimals = (tokenObj: any): number => {
      //   if (
      //     tokenObj?.data?.content &&
      //     "fields" in tokenObj.data.content &&
      //     typeof tokenObj.data.content.fields === "object" &&
      //     tokenObj.data.content.fields &&
      //     "decimals" in tokenObj.data.content.fields
      //   ) {
      //     return Number(tokenObj.data.content.fields.decimals);
      //   }
      //   return 9; // Default to 9 decimals if not found
      // };

      // const decimals0 = getTokenDecimals(token0Obj);
      // const decimals1 = getTokenDecimals(token1Obj);

      const [finalAmount0, finalAmount1, finalDecimals0, finalDecimals1] =
        needToSwap
          ? [amount1, amount0, token1.decimals, token0.decimals]
          : [amount0, amount1, token0.decimals, token1.decimals];
      // Calculate amounts with proper decimal handling
      const amount0Value = Math.floor(
        parseFloat(finalAmount0) * Math.pow(10, finalDecimals0)
      );
      const amount1Value = Math.floor(
        parseFloat(finalAmount1) * Math.pow(10, finalDecimals1)
      );

      // Check balances
      const [coins0, coins1] = await Promise.all([
        suiClient.getCoins({ owner: account.address, coinType: sortedType0 }),
        suiClient.getCoins({ owner: account.address, coinType: sortedType1 }),
      ]);

      const coinToSplit0 = coins0.data.find(
        (coin) => BigInt(coin.balance) >= BigInt(amount0Value)
      );
      const coinToSplit1 = coins1.data.find(
        (coin) => BigInt(coin.balance) >= BigInt(amount1Value)
      );

      if (!coinToSplit0 || !coinToSplit1) {
        throw new Error("Insufficient balance");
      }

      const addLiquidityTx = new Transaction();

      const isSUI0 = sortedType0.includes("0x2::sui::SUI");
      const isSUI1 = sortedType1.includes("0x2::sui::SUI");

      const splitCoin0 = isSUI0
        ? addLiquidityTx.splitCoins(addLiquidityTx.gas, [
            addLiquidityTx.pure.u64(amount0Value),
          ])[0]
        : addLiquidityTx.splitCoins(
            addLiquidityTx.object(coinToSplit0.coinObjectId),
            [addLiquidityTx.pure.u64(amount0Value)]
          )[0];

      const splitCoin1 = isSUI1
        ? addLiquidityTx.splitCoins(addLiquidityTx.gas, [
            addLiquidityTx.pure.u64(amount1Value),
          ])[0]
        : addLiquidityTx.splitCoins(
            addLiquidityTx.object(coinToSplit1.coinObjectId),
            [addLiquidityTx.pure.u64(amount1Value)]
          )[0];

      const deadline = Math.floor(Date.now() + 1200000); // 20 minutes
      const minAmount0 = (BigInt(amount0Value) * 95n) / 100n; // 5% slippage
      const minAmount1 = (BigInt(amount1Value) * 95n) / 100n;

      addLiquidityTx.moveCall({
        target: `${CONSTANTS.PACKAGE_ID}::${CONSTANTS.MODULES.ROUTER}::add_liquidity`,
        arguments: [
          addLiquidityTx.object(CONSTANTS.ROUTER_ID),
          addLiquidityTx.object(CONSTANTS.FACTORY_ID),
          addLiquidityTx.object(currentPairId),
          splitCoin0,
          splitCoin1,
          addLiquidityTx.pure.u256(amount0Value.toString()),
          addLiquidityTx.pure.u256(amount1Value.toString()),
          addLiquidityTx.pure.u256(minAmount0.toString()),
          addLiquidityTx.pure.u256(minAmount1.toString()),
          addLiquidityTx.pure.string(sortedType0.split("::").pop() || ""),
          addLiquidityTx.pure.string(sortedType1.split("::").pop() || ""),
          addLiquidityTx.pure.u64(deadline),
        ],
        typeArguments: [sortedType0, sortedType1],
      });
      console.log("Simulating LP Adding...");
      const simulationResult = await suiClient.devInspectTransactionBlock({
        transactionBlock: addLiquidityTx,
        sender: account.address,
      });

      console.group("📊 Simulation Results");
      console.log("Effects:", simulationResult.effects);
      if (simulationResult.effects?.status?.error) {
        console.error(
          "Simulation Error:",
          simulationResult.effects.status.error
        );
        throw new Error(
          `Simulation Error: ${simulationResult.effects.status.error}`
        );
      }
      console.groupEnd();
      await signAndExecute(
        { transaction: addLiquidityTx },
        {
          onSuccess: async (result) => {
            console.log("Liquidity addition successful:", result);

            try {
              // Process LP events
              const lpEvents = await processLPEvent(result.digest);
              console.log("Processed AddedLP events:", lpEvents);

              // Refresh the reserves and rates
              try {
                const pairObject = await suiClient.getObject({
                  id: currentPairId,
                  options: {
                    showContent: true,
                    showType: true,
                  },
                });

                if (
                  pairObject.data?.content &&
                  "fields" in pairObject.data.content &&
                  typeof pairObject.data.content.fields === "object" &&
                  pairObject.data.content.fields &&
                  "reserve0" in pairObject.data.content.fields &&
                  "reserve1" in pairObject.data.content.fields &&
                  "block_timestamp_last" in pairObject.data.content.fields
                ) {
                  const fields = pairObject.data.content.fields;

                  // Update reserves
                  setReserves({
                    reserve0: fields.reserve0 as string,
                    reserve1: fields.reserve1 as string,
                    timestamp: fields.block_timestamp_last as number,
                  });

                  // Calculate and update price rates
                  const rate0 = (
                    Number(fields.reserve1) / Number(fields.reserve0)
                  ).toFixed(3);
                  const rate1 = (
                    Number(fields.reserve0) / Number(fields.reserve1)
                  ).toFixed(3);
                  setPriceRate0(rate0);
                  setPriceRate1(rate1);
                }
              } catch (error) {
                console.error("Error refreshing reserves:", error);
              }

              // Clear inputs and show success message
              setAmount0("");
              setAmount1("");
              toast.update(toastId, {
                render: "Added liquidity Successfully",
                type: "success",
                isLoading: false,
                autoClose: 5000,
              });
            } catch (error) {
              console.error("Error processing LP events:", error);
              // Still show success toast since the transaction succeeded
              toast.update(toastId, {
                render: "Liquidity added successfully",
                type: "success",
                isLoading: false,
                autoClose: 5000,
              });
            }
          },
          onError: (error) => {
            console.error("Transaction error:", error);
            toast.update(toastId, {
              render: "Transaction failed",
              type: "error",
              isLoading: false,
              autoClose: 5000,
            });
            throw error;
          },
        }
      );
    } catch (error: any) {
      console.error("Transaction failed:", error);
      let errorMessage = error.message || "Unknown error";

      if (errorMessage.includes("Insufficient balance")) {
        errorMessage = "Insufficient balance to complete the transaction";
      }

      toast.update(toastId, {
        render: "Failed to add liquidity: " + errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
      //   toast.success("Liquidity added successfully!", { toastId });
    }
  };
  // Combined function to handle both operations when needed
  // const handleCreatePairAndAddLiquidity = async () => {
  //   try {
  //     // First create the pair
  //     const pairId = await handleCreatePair();
  //     if (pairId) {
  //       // Then add liquidity
  //       await handleAddLiquidity();
  //     }
  //   } catch (error) {
  //     console.error("Create pair and add liquidity failed:", error);
  //   }
  // };

  function EventsDisplay({ events }: { events: LPEvent[] }) {
    if (!events?.length) {
      return (
        <div className="text-center text-gray-400 mt-4">No LP events found</div>
      );
    }

    return (
      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-800">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-900">
            <tr>
              {/* <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-400"
              >
                Time
              </th> */}
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-400"
              >
                Amount 0
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-400"
              >
                Amount 1
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-400"
              >
                Liquidity
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-400"
              >
                LP Token ID
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-400"
              >
                Sender
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-400"
              >
                Token0 Type
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-400"
              >
                Token1 Type
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-400"
              >
                Total Supply
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-medium text-gray-400"
              >
                Type
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-900/50">
            {events.map((event, idx) => {
              console.log("Rendering event:", event);
              return (
                <tr key={idx} className="hover:bg-gray-800/50">
                  <td className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
                    {event.amount0
                      ? Number(event.amount0).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
                    {event.amount1
                      ? Number(event.amount1).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
                    {event.liquidity
                      ? Number(event.liquidity).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="px-3 py-2 text-xs text-cyan-500 whitespace-nowrap">
                    {event.lpCoinId
                      ? `${event.lpCoinId.slice(0, 6)}...${event.lpCoinId.slice(
                          -4
                        )}`
                      : "N/A"}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
                    {event.sender
                      ? `${event.sender.slice(0, 6)}...${event.sender.slice(
                          -4
                        )}`
                      : "N/A"}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
                    {event.token0Type?.name
                      ? event.token0Type.name.split("::").pop()
                      : "N/A"}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
                    {event.token1Type?.name
                      ? event.token1Type.name.split("::").pop()
                      : "N/A"}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
                    {event.totalSupply
                      ? Number(event.totalSupply).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-300 whitespace-nowrap">
                    {event.type ? event.type.split("::").pop() : "N/A"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      {/* Main Content */}
      <main className="max-w-[480px] mx-auto pt-8 px-4">
        {/* Tab Navigation */}
        <div className="bg-[#222f3e] bg-opacity-10 backdrop-blur-sm rounded-3xl border border-gray-800 shadow-lg transition-all duration-300 hover:border-gray-700">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg text-gray-300 font-semibold">
                Add Liquidity
              </span>
              {token0 && token1 && (
                <div
                  className={`px-3 py-2 rounded-lg text-sm ${
                    pairExists
                      ? "bg-green-500/10 text-green-500"
                      : "bg-yellow-500/10 text-yellow-500"
                  }`}
                >
                  {pairExists ? "✓ Pair Exists" : "⚠ New Pair"}
                </div>
              )}
            </div>

            {token0 && token1 && (
              <div
                className={`p-4 rounded-xl mb-4 ${
                  pairExists ? "bg-green-500/5" : "bg-yellow-500/5"
                } border ${
                  pairExists ? "border-green-500/20" : "border-yellow-500/20"
                }`}
              >
                {pairExists ? (
                  <>
                    <div className="text-sm text-gray-300">{`Pair ID: ${currentPairId?.slice(
                      0,
                      8
                    )}...`}</div>
                    <div className="text-cyan-500 font-medium mt-1">
                      {token0.symbol}:{" "}
                      {Number(
                        Number(reserves.reserve0) /
                          Math.pow(10, token0.decimals)
                      ).toFixed(3)}
                      <br />
                      {token1.symbol}:{" "}
                      {Number(
                        Number(reserves.reserve1) /
                          Math.pow(10, token1.decimals)
                      ).toFixed(3)}
                    </div>
                    {priceRate0 && priceRate1 && (
                      <div className="mt-2 text-sm text-gray-400">
                        <div>{`1 ${
                          token0?.symbol || "Token0"
                        } = ${priceRate0} ${token1?.symbol || "Token1"}`}</div>
                        <div>{`1 ${
                          token1?.symbol || "Token1"
                        } = ${priceRate1} ${token0?.symbol || "Token0"}`}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-yellow-500">
                    New trading pair will be created
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs sm:text-sm text-gray-400">
                    First Token
                  </label>
                  <span className="text-xs sm:text-sm text-gray-400">
                    Balance: {balance0}
                  </span>
                </div>
                <TokenSelector
                  label="Token 0"
                  onSelect={handleToken0Change}
                  amount={amount0}
                  onAmountChange={(value) => {
                    setAmount0(value);

                    if (
                      value &&
                      reserves.reserve0 !== "0" &&
                      reserves.reserve1 !== "0"
                    ) {
                      // Calculate suggested amount based on reserve ratios
                      const suggestedAmount = (
                        Number(value) *
                        (Number(reserves.reserve1) / Number(reserves.reserve0))
                      ).toFixed(3);
                      setAmount1(suggestedAmount);
                      setSuggestedLiquidityAmount(suggestedAmount);
                    }
                  }}
                  showInput={pairExists}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs sm:text-sm text-gray-400">
                    Second Token
                  </label>
                  <span className="text-xs sm:text-sm text-gray-400">
                    Balance: {balance1}
                  </span>
                </div>
                <TokenSelector
                  label="Token 1"
                  onSelect={handleToken1Change}
                  amount={amount1}
                  onAmountChange={setAmount1}
                  showInput={pairExists} // Only show input if pair exists
                />
              </div>
              {/* Display suggested amount and warning in liquidity mode */}
              <div className="mt-2">
                {suggestedLiquidityAmount && (
                  <div className="px-3 py-2 bg-gray-800/30 rounded-lg text-xs">
                    <span className="text-gray-400">
                      Suggested amount based on pool ratio:{" "}
                    </span>
                    <span className="text-cyan-500 font-medium">
                      {suggestedLiquidityAmount} {token0?.symbol}
                    </span>
                  </div>
                )}
                {suggestedLiquidityAmount &&
                  amount1 &&
                  Number(amount1) !== Number(suggestedLiquidityAmount) && (
                    <div className="mt-2 px-3 py-2 bg-yellow-500/10 rounded-lg">
                      <div className="text-xs text-yellow-500">
                        ⚠️ Current amount differs from the suggested amount.
                        This may result in sub-optimal liquidity provision.
                      </div>
                    </div>
                  )}
              </div>

              {/* Add Liquidity Button */}
              <button
                onClick={pairExists ? handleAddLiquidity : handleCreatePair}
                disabled={
                  isLoading ||
                  !token0 ||
                  !token1 ||
                  (pairExists ? !amount0 || !amount1 : false) // Only check amounts if pair exists
                }
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {pairExists ? "Adding Liquidity..." : "Creating Pair..."}
                  </div>
                ) : pairExists ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add Liquidity
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Create Trading Pair
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
      <div className="mt-8 max-w-full  mx-auto px-4">
        <div className="bg-[#222f3e] bg-opacity-10 backdrop-blur-sm rounded-3xl border border-gray-800 shadow-lg p-4">
          <h2 className="text-lg text-gray-300 font-semibold mb-4">
            Recent LP Event
          </h2>
          <EventsDisplay events={events} />
        </div>
      </div>
    </>
  );
}
