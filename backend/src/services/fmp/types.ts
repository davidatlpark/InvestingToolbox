// Financial Modeling Prep API response types
// Updated for stable API endpoints (not legacy v3)

export interface FMPCompanyProfile {
  symbol: string;
  companyName: string; // stable API field name
  currency: string;
  exchange: string;
  exchangeFullName?: string;
  exchangeShortName?: string; // legacy field, may not exist
  industry: string;
  sector: string;
  country: string;
  description: string;
  website: string;
  marketCap: number; // stable API uses marketCap (not mktCap)
  mktCap?: number; // legacy field fallback
  price: number;
  volAvg?: number;
  averageVolume?: number; // stable API field
  ipoDate: string;
  isEtf: boolean;
  isActivelyTrading: boolean;
}

export interface FMPIncomeStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear?: string; // legacy field
  fiscalYear?: string; // stable API field
  period: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  researchAndDevelopmentExpenses: number;
  generalAndAdministrativeExpenses: number;
  sellingAndMarketingExpenses: number;
  sellingGeneralAndAdministrativeExpenses: number;
  otherExpenses: number;
  operatingExpenses: number;
  costAndExpenses: number;
  interestIncome: number;
  interestExpense: number;
  depreciationAndAmortization: number;
  ebitda: number;
  ebitdaratio: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  totalOtherIncomeExpensesNet: number;
  incomeBeforeTax: number;
  incomeBeforeTaxRatio: number;
  incomeTaxExpense: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
}

export interface FMPBalanceSheet {
  date: string;
  symbol: string;
  reportedCurrency: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear?: string; // legacy field
  fiscalYear?: string; // stable API field
  period: string;
  cashAndCashEquivalents: number;
  shortTermInvestments: number;
  cashAndShortTermInvestments: number;
  netReceivables: number;
  inventory: number;
  otherCurrentAssets: number;
  totalCurrentAssets: number;
  propertyPlantEquipmentNet: number;
  goodwill: number;
  intangibleAssets: number;
  goodwillAndIntangibleAssets: number;
  longTermInvestments: number;
  taxAssets: number;
  otherNonCurrentAssets: number;
  totalNonCurrentAssets: number;
  otherAssets: number;
  totalAssets: number;
  accountPayables: number;
  shortTermDebt: number;
  taxPayables: number;
  deferredRevenue: number;
  otherCurrentLiabilities: number;
  totalCurrentLiabilities: number;
  longTermDebt: number;
  deferredRevenueNonCurrent: number;
  deferredTaxLiabilitiesNonCurrent: number;
  otherNonCurrentLiabilities: number;
  totalNonCurrentLiabilities: number;
  otherLiabilities: number;
  capitalLeaseObligations: number;
  totalLiabilities: number;
  preferredStock: number;
  commonStock: number;
  retainedEarnings: number;
  accumulatedOtherComprehensiveIncomeLoss: number;
  othertotalStockholdersEquity: number;
  totalStockholdersEquity: number;
  totalEquity: number;
  totalLiabilitiesAndStockholdersEquity: number;
  minorityInterest: number;
  totalLiabilitiesAndTotalEquity: number;
  totalInvestments: number;
  totalDebt: number;
  netDebt: number;
}

export interface FMPCashFlowStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear?: string; // legacy field
  fiscalYear?: string; // stable API field
  period: string;
  netIncome: number;
  depreciationAndAmortization: number;
  deferredIncomeTax: number;
  stockBasedCompensation: number;
  changeInWorkingCapital: number;
  accountsReceivables: number;
  inventory: number;
  accountsPayables: number;
  otherWorkingCapital: number;
  otherNonCashItems: number;
  netCashProvidedByOperatingActivities: number;
  investmentsInPropertyPlantAndEquipment: number;
  acquisitionsNet: number;
  purchasesOfInvestments: number;
  salesMaturitiesOfInvestments: number;
  otherInvestingActivites: number;
  netCashUsedForInvestingActivites: number;
  debtRepayment: number;
  commonStockIssued: number;
  commonStockRepurchased: number;
  dividendsPaid: number;
  otherFinancingActivites: number;
  netCashUsedProvidedByFinancingActivities: number;
  effectOfForexChangesOnCash: number;
  netChangeInCash: number;
  cashAtEndOfPeriod: number;
  cashAtBeginningOfPeriod: number;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
}

export interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changePercentage: number; // stable API uses changePercentage
  changesPercentage?: number; // legacy field fallback
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  volume: number;
  avgVolume?: number;
  averageVolume?: number; // stable API uses averageVolume
  open: number;
  previousClose: number;
  eps?: number;
  pe?: number;
  earningsAnnouncement?: string;
  sharesOutstanding?: number;
  timestamp: number;
}

export interface FMPSearchResult {
  symbol: string;
  name: string;
  currency: string;
  stockExchange?: string; // legacy field
  exchangeFullName?: string; // stable API field
  exchangeShortName?: string;
  exchange?: string;
}

export interface FMPKeyMetrics {
  symbol: string;
  date: string;
  calendarYear?: string; // legacy field
  fiscalYear?: string; // stable API field
  period: string;
  revenuePerShare?: number;
  netIncomePerShare?: number;
  operatingCashFlowPerShare?: number;
  freeCashFlowPerShare?: number;
  cashPerShare?: number;
  bookValuePerShare: number;
  tangibleBookValuePerShare?: number;
  shareholdersEquityPerShare?: number;
  interestDebtPerShare?: number;
  marketCap: number;
  enterpriseValue: number;
  peRatio?: number;
  priceToSalesRatio?: number;
  pocfratio?: number;
  pfcfRatio?: number;
  pbRatio?: number;
  ptbRatio?: number;
  evToSales: number;
  enterpriseValueOverEBITDA?: number;
  evToEBITDA?: number; // stable API field
  evToOperatingCashFlow: number;
  evToFreeCashFlow: number;
  earningsYield: number;
  freeCashFlowYield: number;
  debtToEquity: number;
  debtToAssets?: number;
  netDebtToEBITDA: number;
  currentRatio: number;
  interestCoverage?: number;
  incomeQuality: number;
  dividendYield?: number;
  payoutRatio?: number;
  salesGeneralAndAdministrativeToRevenue?: number;
  researchAndDdevelopementToRevenue?: number;
  researchAndDevelopementToRevenue?: number; // stable API (different spelling)
  intangiblesToTotalAssets: number;
  capexToOperatingCashFlow: number;
  capexToRevenue: number;
  capexToDepreciation: number;
  stockBasedCompensationToRevenue: number;
  grahamNumber: number;
  roic?: number; // legacy field
  returnOnInvestedCapital?: number; // stable API field
  returnOnTangibleAssets: number;
  returnOnAssets?: number; // stable API field
  returnOnEquity?: number; // stable API field
  roe?: number; // legacy field
  grahamNetNet: number;
  workingCapital: number;
  tangibleAssetValue: number;
  netCurrentAssetValue: number;
  investedCapital: number;
  averageReceivables: number;
  averagePayables: number;
  averageInventory: number;
  daysSalesOutstanding?: number;
  daysOfSalesOutstanding?: number; // stable API (different naming)
  daysPayablesOutstanding?: number;
  daysOfPayablesOutstanding?: number; // stable API
  daysOfInventoryOnHand?: number;
  daysOfInventoryOutstanding?: number; // stable API
  receivablesTurnover?: number;
  payablesTurnover?: number;
  inventoryTurnover?: number;
  capexPerShare?: number;
}

// Normalized internal type
export interface NormalizedFinancialStatement {
  fiscalYear: number;
  fiscalQuarter: number | null;
  periodEndDate: Date;
  filingDate: Date | null;
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  operatingExpenses: number | null;
  operatingIncome: number | null;
  interestExpense: number | null;
  incomeBeforeTax: number | null;
  incomeTaxExpense: number | null;
  netIncome: number | null;
  eps: number | null;
  epsDiluted: number | null;
  sharesOutstanding: number | null;
  cashAndEquivalents: number | null;
  shortTermInvestments: number | null;
  totalCurrentAssets: number | null;
  propertyPlantEquip: number | null;
  goodwill: number | null;
  intangibleAssets: number | null;
  totalAssets: number | null;
  accountsPayable: number | null;
  shortTermDebt: number | null;
  totalCurrentLiab: number | null;
  longTermDebt: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  bookValuePerShare: number | null;
  operatingCashFlow: number | null;
  capitalExpenditures: number | null;
  freeCashFlow: number | null;
  dividendsPaid: number | null;
  netChangeInCash: number | null;
  roic: number | null;
  roe: number | null;
  currentRatio: number | null;
  debtToEquity: number | null;
}
