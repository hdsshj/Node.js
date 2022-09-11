interface PostCounterType {
  _id: any;
  totalPost: number;
  name: string;
}

interface PostType {
  _id: number;
  title: string;
  date: string;
  createdAt: string;
  writer: number;
}

interface MemberType {
  _id: number;
  memberId: string;
  password: string;
}
