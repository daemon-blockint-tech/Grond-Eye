import { LatticeC2Dashboard } from '@/components/c2/LatticeC2Dashboard';

export const metadata = {
  title: 'C2 Command & Control | MAVEN SYSTEM',
  description: 'Enterprise threat intelligence and autonomous mission platform - C2 command & control interface',
};

export default function C2Page() {
  return <LatticeC2Dashboard />;
}
