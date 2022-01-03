export interface Transaction {
  to: string;
  data: string;
  value: string;
}

export interface IsClaimed {
	address: string
	index: number
	isClaimed: boolean
	proof: string[]
	amount: string
}

export enum Token {
	Uma = "uma",
	Matic = "matic"
} 