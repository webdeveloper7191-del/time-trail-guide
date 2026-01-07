// Simulated API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Generic API response type
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Mock API wrapper that simulates network calls
export async function mockApiCall<T>(
  data: T,
  options?: { delay?: number; shouldFail?: boolean; errorMessage?: string }
): Promise<ApiResponse<T>> {
  await delay(options?.delay ?? 300 + Math.random() * 200);
  
  if (options?.shouldFail) {
    throw new Error(options.errorMessage ?? 'API request failed');
  }
  
  return { data, success: true };
}

// Search helper with filtering
export async function mockSearchCall<T>(
  items: T[],
  query: string,
  searchFields: (keyof T)[],
  options?: { delay?: number }
): Promise<ApiResponse<T[]>> {
  await delay(options?.delay ?? 200);
  
  if (!query.trim()) {
    return { data: items, success: true };
  }
  
  const lowerQuery = query.toLowerCase();
  const filtered = items.filter(item =>
    searchFields.some(field => {
      const value = item[field];
      return typeof value === 'string' && value.toLowerCase().includes(lowerQuery);
    })
  );
  
  return { data: filtered, success: true };
}

// Pagination helper
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function mockPaginatedCall<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 10,
  options?: { delay?: number }
): Promise<ApiResponse<PaginatedResponse<T>>> {
  await delay(options?.delay ?? 300);
  
  const start = (page - 1) * pageSize;
  const paginatedItems = items.slice(start, start + pageSize);
  
  return {
    data: {
      data: paginatedItems,
      total: items.length,
      page,
      pageSize,
      totalPages: Math.ceil(items.length / pageSize),
    },
    success: true,
  };
}
