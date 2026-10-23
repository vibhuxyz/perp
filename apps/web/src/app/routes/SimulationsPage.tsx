import { useSimulationStore } from '@/features/simulations/useSimulationStore';
import { ScenarioCatalog } from '@/features/simulations/components/ScenarioCatalog';
import { SimulationStage } from '@/features/simulations/components/SimulationStage';

export default function SimulationsPage() {
  const status = useSimulationStore(s => s.status);

  if (status === 'catalog') {
    return <ScenarioCatalog />;
  }

  return <SimulationStage />;
}
