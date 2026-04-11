// 召唤骰子
export default function summonDice(diceId: number): string | null
{
  if (diceId >= 0 && diceId <= 7)
  {
    return `)@${diceId}`;
  }
  return null;
}
