
export interface Post {
	id: number;
	user: {
		name: string;
		username: string;
		avatar: string;
		time: string;
		avatarColor: string;
	};
	content: string;
	likes: number;
	comments: number;
	shares: number;
	tags?: string[];
	poll?: {
		question: string;
		options: string[];
	};
}
