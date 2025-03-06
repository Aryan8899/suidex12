import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface Pool {
  pair: string;
  chain: string;
  version: string;
  feeTier: string;
  apr: {
    current: string;
    previous: string;
  };
  tvl: string;
  volume24h: string;
  poolType: string;
  tokens: string[];
}

interface HistoryData {
  sender: string;
  lpCoinId: string;
  pairId: string;
  transactionHash: string;
  token0Type: { name: string };
  token1Type: { name: string };
  amount0: string;
  amount1: string;
  liquidity: string;
  totalSupply: string;
  timestamp: string;
  type: string;
}

const PoolsInterface: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("history");
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const account = useCurrentAccount();

  const allPools: Pool[] = [
    {
      pair: "USDT / WBNB",
      chain: "BNB SMART CHAIN",
      version: "V3",
      feeTier: "0.01%",
      apr: {
        current: "107.58%",
        previous: "98.42%",
      },
      tvl: "$ 5,808,463.8",
      volume24h: "$ 141M",
      poolType: "v3",
      tokens: ["USDT", "WBNB"],
    },
    {
      pair: "USDC / WBNB",
      chain: "BNB SMART CHAIN",
      version: "V3",
      feeTier: "0.05%",
      apr: {
        current: "11.56%",
        previous: "10.62%",
      },
      tvl: "$ 52,280,865",
      volume24h: "$ 27,707,066",
      poolType: "v3",
      tokens: ["USDC", "WBNB"],
    },
    {
      pair: "ETH / WBNB",
      chain: "BNB SMART CHAIN",
      version: "V3",
      feeTier: "0.05%",
      apr: {
        current: "76.15%",
        previous: "71.12%",
      },
      tvl: "$ 5,005,882.5",
      volume24h: "$ 18,113,972",
      poolType: "v3",
      tokens: ["ETH", "WBNB"],
    },
  ];

  // Fetch history data for the logged-in account
  useEffect(() => {
    if (!account?.address) return;

    const fetchHistory = async () => {
      try {
        const response = await fetch(
          `https://dexback-mu.vercel.app/api/lpcoin/${account.address}`
        );
        if (!response.ok) throw new Error("Failed to fetch history");

        const data = await response.json();
        setHistoryData(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };

    fetchHistory();
  }, [account?.address]);

  return (
    <div className="min-h-screen text-white p-4">
      <div className="max-w-[1200px] mx-auto bg-[#1f2028]/40 rounded-2xl p-6 border border-[#8b7bef]/50 shadow-md">
        {/* Navigation Tabs */}
        <div
          style={{
            boxShadow: "0px 0px 10px #8b7bef, 0px 0px 10px #8b7bef inset",
          }}
          className="flex justify-center lg:w-1/3 md:w-2/4 mb-[1.5rem] p-[0.25rem] border border-[#8b7bef] rounded-2xl"
        >
          {["history", "all-pools", "my-positions"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                backgroundColor: activeTab === tab ? "#8b7bef" : "transparent",
              }}
              className="flex-1 p-[0.5rem] text-[#fff] cursor-pointer rounded-xl text-center"
            >
              {tab.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-[1rem] mb-[1.5rem] w-full">
          {/* Search Input */}
          <div
            style={{
              position: "relative",
              flex: 1,
              maxWidth: "400px",
              width: "100%",
            }}
          >
            <input
              type="text"
              placeholder="All tokens"
              style={{
                width: "100%",
                backgroundColor: "#2c2d3a",
                color: "#fff",
                border: "none",
                padding: "0.5rem 0.5rem 0.5rem 2rem",
                borderRadius: "0.25rem",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            >
              🔍
            </span>
          </div>

          {/* Spacing */}
          <div className="flex-grow hidden md:block"></div>

          {/* Buttons */}
          <button
            style={{
              boxShadow: "0px 0px 10px #8b7bef, 0px 0px 10px #8b7bef inset",
            }}
            onClick={() => navigate("/addliquidity")}
            className="bg-[#8b7bef] text-[#fff] py-[0.5rem] px-[1rem] rounded-xl cursor-pointer w-full md:w-auto"
          >
            Add Liquidity
          </button>
          <button
            style={{
              boxShadow: "0px 0px 10px #ec4040, 0px 0px 10px #ec4040 inset",
            }}
            onClick={() => navigate("/removeliquidity")}
            className="bg-[#ec4040] text-[#fff] py-[0.5rem] px-[1rem] rounded-xl cursor-pointer w-full md:w-auto"
          >
            Remove Liquidity
          </button>
        </div>

        {/* Table for Active Pools, Positions, and History */}
        <div className="overflow-x-auto">
          {activeTab === "history" ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-sm text-[#b794f4]">
                  <th className="p-3">LP Coin ID</th>
                  <th className="p-3">Pair ID</th>
                  <th className="p-3">Tx Digest</th>
                  <th className="p-3">Token 0 Type</th>
                  <th className="p-3">Token 1 Type</th>
                  <th className="p-3">Amount 0</th>
                  <th className="p-3">Amount 1</th>
                  <th className="p-3">Total Supply</th>
                  <th className="p-3">Liquidity</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Sender</th>
                </tr>
              </thead>
              <tbody>
                {historyData.length > 0 ? (
                  historyData.map((entry, index) => (
                    <tr
                      key={index}
                      className="border-t border-[#4a5568] hover:bg-[#2c2d3a]/50 transition"
                    >
                      <td className="p-3">
                        {entry.lpCoinId
                          ? `${entry.lpCoinId.slice(
                              0,
                              6
                            )}...${entry.lpCoinId.slice(-4)}`
                          : "N/A"}
                      </td>
                      <td className="p-3">
                        {entry.pairId
                          ? `${entry.pairId.slice(0, 6)}...${entry.pairId.slice(
                              -4
                            )}`
                          : "N/A"}
                      </td>
                      <td className="p-3">
                        {entry.transactionHash
                          ? `${entry.transactionHash.slice(
                              0,
                              6
                            )}...${entry.transactionHash.slice(-4)}`
                          : "N/A"}
                      </td>
                      <td className="p-3">
                        {entry.token0Type.name.split("::").pop()}
                      </td>
                      <td className="p-3">
                        {entry.token1Type.name.split("::").pop()}
                      </td>
                      <td className="p-3">
                        {Number(entry.amount0).toLocaleString()}
                      </td>
                      <td className="p-3">
                        {Number(entry.amount1).toLocaleString()}
                      </td>
                      <td className="p-3">
                        {entry.totalSupply
                          ? Number(entry.totalSupply).toLocaleString()
                          : "N/A"}
                      </td>
                      <td className="p-3">
                        {Number(entry.liquidity).toLocaleString()}
                      </td>
                      <td className="p-3">
                        {entry.type ? entry.type.split("::").pop() : "N/A"}
                      </td>
                      <td className="p-3">
                        {entry.sender.slice(0, 6)}...{entry.sender.slice(-4)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="p-3 text-center text-gray-400">
                      No history data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-sm text-[#b794f4]">
                  <th className="p-3">All Pools</th>
                  <th className="p-3">Fee Tier</th>
                  <th className="p-3">APR</th>
                  <th className="p-3">TVL</th>
                  <th className="p-3">Volume 24H</th>
                  <th className="p-3">Pool Type</th>
                </tr>
              </thead>
              <tbody>
                {allPools.map((pool, index) => (
                  <tr
                    key={index}
                    className="border-t border-[#4a5568] hover:bg-[#2c2d3a]/50 transition"
                  >
                    <td className="p-3">{pool.pair}</td>
                    <td className="p-3">{pool.feeTier}</td>
                    <td className="p-3">{pool.apr.current}</td>
                    <td className="p-3">{pool.tvl}</td>
                    <td className="p-3">{pool.volume24h}</td>
                    <td className="p-3">{pool.poolType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoolsInterface;
