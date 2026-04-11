// 修改自身账号信息
export type ProfileData = Partial<{
  surname: string;
  name: string;
  birthday: string;
  tag: string;
  hobby: string;
  residence: string;
  website: string;
  family: string;
}>;

export default function updateSelfInfo(profileData: ProfileData): string
{
  return `$2${JSON.stringify(profileData)}`;
}
