import React from 'react';
import { History as HistoryInterface } from '../../interfaces/history';
import { Ps1 } from '../ps1';
import { useShell } from '../../utils/shellProvider';

interface Props {
  history: Array<HistoryInterface>;
}

export const History: React.FC<Props> = ({ history }) => {
  const { isExecuting, catMode } = useShell();

  return (
    <>
      {history.map((entry: HistoryInterface, index: number) => {
        // Always show completed entries normally
        // For the last entry during execution, only show if there's actual output
        const isLastEntry = index === history.length - 1;
        const showOutput = entry.output !== '' || !isLastEntry || !isExecuting;

        return (
          <div key={entry.command + index}>
            <div className="flex flex-row space-x-2">
              <div className="flex-shrink">
                <Ps1 />
              </div>
              <div className="flex-grow">{entry.command}</div>
            </div>

            {showOutput && (
              <p
                className="whitespace-pre-wrap mb-2"
                style={{ lineHeight: 'normal' }}
                dangerouslySetInnerHTML={{ __html: entry.output }}
              />
            )}
          </div>
        );
      })}
    </>
  );
};

export default History;