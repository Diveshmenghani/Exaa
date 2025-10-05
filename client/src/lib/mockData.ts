// Mock data service for client-only deployment
export const mockData = {
  users: {
    "0x1234567890123456789012345678901234567890": {
      id: "1",
      walletAddress: "0x1234567890123456789012345678901234567890",
      referralCode: "REF123",
      referrerCode: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      telegramId: null,
    }
  },
  stakes: [
    {
      id: "1",
      userId: "1",
      amount: "1000",
      duration: 12,
      apy: 10,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  referrals: [],
  contractSettings: {
    minStakeAmount: "100",
    maxStakeAmount: "100000",
    stakingEnabled: true,
  }
};

// Mock API functions
export const mockApiRequest = async (method: string, url: string, data?: unknown): Promise<Response> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const mockResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  // Handle different API endpoints
  if (url.includes('/api/users/register')) {
    return mockResponse({ message: "User registered successfully", user: Object.values(mockData.users)[0] });
  }

  if (url.includes('/api/users/')) {
    const walletAddress = url.split('/').pop();
    const user = mockData.users[walletAddress as keyof typeof mockData.users];
    return mockResponse(user || null);
  }

  if (url.includes('/api/stakes/user/')) {
    return mockResponse(mockData.stakes);
  }

  if (url.includes('/api/stakes') && method === 'POST') {
    return mockResponse({ message: "Stake created successfully" });
  }

  if (url.includes('/api/stakes') && url.includes('/unstake')) {
    return mockResponse({ message: "Unstake successful" });
  }

  if (url.includes('/api/referrals')) {
    return mockResponse(mockData.referrals);
  }

  if (url.includes('/api/contract/settings')) {
    return mockResponse(mockData.contractSettings);
  }

  // Default response
  return mockResponse({ message: "Mock API response" });
};

export const mockQueryFn = async ({ queryKey }: { queryKey: string[] }) => {
  const url = queryKey.join("/");
  
  if (url.includes('/api/users/')) {
    const walletAddress = url.split('/').pop();
    return mockData.users[walletAddress as keyof typeof mockData.users] || null;
  }

  if (url.includes('/api/stakes/user/')) {
    return mockData.stakes;
  }

  if (url.includes('/api/referrals')) {
    return mockData.referrals;
  }

  if (url.includes('/api/contract/settings')) {
    return mockData.contractSettings;
  }

  return null;
};