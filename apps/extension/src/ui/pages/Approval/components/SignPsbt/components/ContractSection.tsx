import { Row, Text } from '@/ui/components';
import { ContractResult } from '@unisat/wallet-shared';

export default function ContractSection(props: {
  contract: ContractResult;
  setContractPopoverData: (contract: ContractResult) => void;
}) {
  const { contract, setContractPopoverData } = props;
  return (
    <Row
      style={{
        borderWidth: 1,
        borderColor: 'rgba(52, 93, 157, 0.32)',
        borderRadius: 5,
        padding: 2,
        backgroundColor: 'rgba(52, 93, 157, 0.22)'
      }}
      onClick={() => {
        setContractPopoverData(contract);
      }}>
      <Text text={contract.name + ' >'} style={{ color: 'rgba(158, 192, 240, 0.95)' }} size="xs" />
    </Row>
  );
}
