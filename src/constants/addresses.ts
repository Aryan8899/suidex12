export const CONSTANTS = {
  PACKAGE_ID:
    "0xc1a0891b7d140ef5f28a02a06ed650d61338ff7ce092af8798f2db901a5528db",
  ROUTER_ID:
    "0x58440b8f50bc3f1afe98b6b80c427220fc68cbe5c305d2d36c119d0cec5c4a4e",
  FACTORY_ID:
    "0x3e00945fd2f5517dd5f2d13fe4e734a541633a7182bc22710cf1f56bd2e4894b",
  ADMIN_CAP_ID:
    "0x34b4b4937b5770a002fbe355d6bc7b52430b8842e417c443644f93b5efaddc4d",
  UPGRADE_CAP_ID:
    "0xc537d68acd542d7419fb2bdd8a228271b6cd105e59e41d6adeeb9657e7d32592",
  MODULES: {
    FACTORY: "factory",
    PAIR: "pair",
    ROUTER: "router",
    LIBRARY: "library",
    FIXED_POINT_MATH: "fixed_point_math",
  },
  getPairID: (token0: string, token1: string) => `${token0}_${token1}_pair`,
};
