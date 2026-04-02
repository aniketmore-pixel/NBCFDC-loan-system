export const kpiData = {
  totalChannelPartners: 156,
  amountDisbursed: 2847500000,
  activeLoans: 12453,
  npaRate: 3.2,
  avgCompositeScore: 72.5,
  autoEligibleBeneficiaries: 8234,
};

export const riskBandData = [
  { name: "Low Risk / High Need", value: 35, fill: "hsl(var(--chart-5))" },
  { name: "Low Risk / Low Need", value: 20, fill: "hsl(var(--chart-1))" },
  { name: "Medium Risk / High Need", value: 25, fill: "hsl(var(--chart-3))" },
  { name: "Medium Risk / Low Need", value: 12, fill: "hsl(var(--chart-2))" },
  { name: "High Risk / High Need", value: 5, fill: "hsl(var(--chart-4))" },
  { name: "High Risk / Low Need", value: 3, fill: "hsl(var(--chart-4))" },
];

export const disbursementTrendData = [
  { month: "Jan", disbursement: 180, npa: 2.8 },
  { month: "Feb", disbursement: 220, npa: 2.9 },
  { month: "Mar", disbursement: 250, npa: 3.0 },
  { month: "Apr", disbursement: 280, npa: 3.1 },
  { month: "May", disbursement: 310, npa: 3.0 },
  { month: "Jun", disbursement: 350, npa: 3.2 },
  { month: "Jul", disbursement: 380, npa: 3.1 },
  { month: "Aug", disbursement: 420, npa: 3.2 },
  { month: "Sep", disbursement: 450, npa: 3.3 },
  { month: "Oct", disbursement: 480, npa: 3.2 },
  { month: "Nov", disbursement: 510, npa: 3.1 },
  { month: "Dec", disbursement: 540, npa: 3.2 },
];

export const stateWiseData = [
  { state: "Maharashtra", disbursement: 450 },
  { state: "Uttar Pradesh", disbursement: 380 },
  { state: "Tamil Nadu", disbursement: 320 },
  { state: "Karnataka", disbursement: 290 },
  { state: "Gujarat", disbursement: 270 },
  { state: "Rajasthan", disbursement: 240 },
  { state: "West Bengal", disbursement: 220 },
  { state: "Madhya Pradesh", disbursement: 200 },
];

export const topPerformingPartners = [
  { name: "Maharashtra SCA", npaRate: 1.2, score: 89, disbursement: 450 },
  { name: "Tamil Nadu SCA", npaRate: 1.5, score: 86, disbursement: 320 },
  { name: "Karnataka SCA", npaRate: 1.8, score: 84, disbursement: 290 },
  { name: "Gujarat SCA", npaRate: 2.0, score: 82, disbursement: 270 },
  { name: "Rajasthan SCA", npaRate: 2.2, score: 80, disbursement: 240 },
];

export const bottomPerformingPartners = [
  { name: "Bihar RRB", npaRate: 8.5, score: 45, disbursement: 80 },
  { name: "Jharkhand SCA", npaRate: 7.8, score: 48, disbursement: 95 },
  { name: "Odisha Regional", npaRate: 7.2, score: 52, disbursement: 110 },
  { name: "Assam Coop Bank", npaRate: 6.8, score: 55, disbursement: 85 },
  { name: "Chhattisgarh SCA", npaRate: 6.5, score: 58, disbursement: 120 },
];

export type PartnerType = "SCA" | "RRB" | "Cooperative Bank" | "NBFC";
export type PartnerStatus = "Active" | "Inactive" | "Under Review";

export interface ChannelPartner {
  id: string;
  name: string;
  type: PartnerType;
  state: string;
  totalBeneficiaries: number;
  activeLoans: number;
  amountDisbursed: number;
  avgScore: number;
  npaRate: number;
  status: PartnerStatus;
  email: string;
  phone: string;
  address: string;
  registeredDate: string;
}

export const channelPartners: ChannelPartner[] = [
  {
    id: "CP001",
    name: "Maharashtra State Channelizing Agency",
    type: "SCA",
    state: "Maharashtra",
    totalBeneficiaries: 12500,
    activeLoans: 3420,
    amountDisbursed: 450000000,
    avgScore: 89,
    npaRate: 1.2,
    status: "Active",
    email: "contact@mah-sca.gov.in",
    phone: "+91 22 2285 1234",
    address: "Administrative Building, Mumbai 400001",
    registeredDate: "2018-03-15",
  },
  {
    id: "CP002",
    name: "Tamil Nadu State Channelizing Agency",
    type: "SCA",
    state: "Tamil Nadu",
    totalBeneficiaries: 9800,
    activeLoans: 2850,
    amountDisbursed: 320000000,
    avgScore: 86,
    npaRate: 1.5,
    status: "Active",
    email: "contact@tn-sca.gov.in",
    phone: "+91 44 2567 8901",
    address: "State Complex, Chennai 600002",
    registeredDate: "2017-08-22",
  },
  {
    id: "CP003",
    name: "Karnataka State Channelizing Agency",
    type: "SCA",
    state: "Karnataka",
    totalBeneficiaries: 8200,
    activeLoans: 2340,
    amountDisbursed: 290000000,
    avgScore: 84,
    npaRate: 1.8,
    status: "Active",
    email: "contact@kar-sca.gov.in",
    phone: "+91 80 2234 5678",
    address: "Vidhana Soudha, Bengaluru 560001",
    registeredDate: "2018-01-10",
  },
  {
    id: "CP004",
    name: "Gujarat State Channelizing Agency",
    type: "SCA",
    state: "Gujarat",
    totalBeneficiaries: 7600,
    activeLoans: 2100,
    amountDisbursed: 270000000,
    avgScore: 82,
    npaRate: 2.0,
    status: "Active",
    email: "contact@guj-sca.gov.in",
    phone: "+91 79 2345 6789",
    address: "Sachivalaya, Gandhinagar 382010",
    registeredDate: "2017-11-05",
  },
  {
    id: "CP005",
    name: "Bihar Regional Rural Bank",
    type: "RRB",
    state: "Bihar",
    totalBeneficiaries: 3200,
    activeLoans: 890,
    amountDisbursed: 80000000,
    avgScore: 45,
    npaRate: 8.5,
    status: "Under Review",
    email: "contact@bihar-rrb.in",
    phone: "+91 612 234 5678",
    address: "Bank Road, Patna 800001",
    registeredDate: "2019-04-18",
  },
  {
    id: "CP006",
    name: "Uttar Pradesh State Channelizing Agency",
    type: "SCA",
    state: "Uttar Pradesh",
    totalBeneficiaries: 11200,
    activeLoans: 3100,
    amountDisbursed: 380000000,
    avgScore: 78,
    npaRate: 2.8,
    status: "Active",
    email: "contact@up-sca.gov.in",
    phone: "+91 522 234 5678",
    address: "Lal Bahadur Shastri Bhawan, Lucknow 226001",
    registeredDate: "2017-06-20",
  },
  {
    id: "CP007",
    name: "Jharkhand State Channelizing Agency",
    type: "SCA",
    state: "Jharkhand",
    totalBeneficiaries: 2800,
    activeLoans: 780,
    amountDisbursed: 95000000,
    avgScore: 48,
    npaRate: 7.8,
    status: "Under Review",
    email: "contact@jh-sca.gov.in",
    phone: "+91 651 234 5678",
    address: "Project Bhawan, Ranchi 834001",
    registeredDate: "2019-09-12",
  },
  {
    id: "CP008",
    name: "West Bengal Cooperative Bank",
    type: "Cooperative Bank",
    state: "West Bengal",
    totalBeneficiaries: 6500,
    activeLoans: 1850,
    amountDisbursed: 220000000,
    avgScore: 75,
    npaRate: 3.2,
    status: "Active",
    email: "contact@wb-coop.in",
    phone: "+91 33 2345 6789",
    address: "BBD Bagh, Kolkata 700001",
    registeredDate: "2018-07-08",
  },
  {
    id: "CP009",
    name: "Rajasthan State Channelizing Agency",
    type: "SCA",
    state: "Rajasthan",
    totalBeneficiaries: 7200,
    activeLoans: 2050,
    amountDisbursed: 240000000,
    avgScore: 80,
    npaRate: 2.2,
    status: "Active",
    email: "contact@raj-sca.gov.in",
    phone: "+91 141 234 5678",
    address: "Secretariat, Jaipur 302005",
    registeredDate: "2017-12-15",
  },
  {
    id: "CP010",
    name: "Assam Cooperative Bank",
    type: "Cooperative Bank",
    state: "Assam",
    totalBeneficiaries: 2100,
    activeLoans: 580,
    amountDisbursed: 85000000,
    avgScore: 55,
    npaRate: 6.8,
    status: "Inactive",
    email: "contact@assam-coop.in",
    phone: "+91 361 234 5678",
    address: "Pan Bazar, Guwahati 781001",
    registeredDate: "2020-02-28",
  },
];

export const states = [
  "Maharashtra",
  "Tamil Nadu",
  "Karnataka",
  "Gujarat",
  "Uttar Pradesh",
  "Rajasthan",
  "West Bengal",
  "Bihar",
  "Jharkhand",
  "Assam",
  "Madhya Pradesh",
  "Odisha",
  "Chhattisgarh",
  "Kerala",
  "Punjab",
];

export const partnerTypes: PartnerType[] = ["SCA", "RRB", "Cooperative Bank", "NBFC"];
export const partnerStatuses: PartnerStatus[] = ["Active", "Inactive", "Under Review"];
