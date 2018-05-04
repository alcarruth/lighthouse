/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Runner = require('../../../../runner');
const EstimatedInputLatency = require('../../../../gather/computed/metrics/estimated-input-latency'); // eslint-disable-line
const assert = require('assert');

const trace = require('../../../fixtures/traces/progressive-app-m60.json');
const devtoolsLog = require('../../../fixtures/traces/progressive-app-m60.devtools.log.json');

/* eslint-env mocha */

describe('Metrics: EIL', () => {
  it('should compute a simulated value', async () => {
    const artifacts = Runner.instantiateComputedArtifacts();
    const settings = {throttlingMethod: 'simulate'};
    const result = await artifacts.requestEstimatedInputLatency({trace, devtoolsLog, settings});

    assert.equal(Math.round(result.timing), 104);
    assert.equal(Math.round(result.optimisticEstimate.timeInMs), 101);
    assert.equal(Math.round(result.pessimisticEstimate.timeInMs), 158);
  });

  it('should compute an observed value', async () => {
    const artifacts = Runner.instantiateComputedArtifacts();
    const settings = {throttlingMethod: 'provided'};
    const result = await artifacts.requestEstimatedInputLatency({trace, devtoolsLog, settings});

    assert.equal(Math.round(result.timing * 10) / 10, 17.1);
  });


  describe('#calculateRollingWindowEIL', () => {
    it('uses a 5s rolling window', async () => {
      const events = [
        {start: 7500, end: 10000, duration: 2500},
        {start: 10000, end: 15000, duration: 5000},
      ];

      assert.equal(EstimatedInputLatency.calculateRollingWindowEIL(events), 4516);
    });

    it('handles continuous tasks', async () => {
      const events = [];
      const longTaskDuration = 100;
      const longTaskNumber = 1000;
      const shortTaskDuration = 1.1;
      const shortTaskNumber = 10000;

      for (let i = 0; i < longTaskNumber; i++) {
        const start = i * longTaskDuration;
        events.push({start: start, end: start + longTaskDuration, duration: longTaskDuration});
      }

      const baseline = events[events.length - 1].end;
      for (let i = 0; i < shortTaskNumber; i++) {
        const start = i * shortTaskDuration + baseline;
        events.push({start: start, end: start + shortTaskDuration, duration: shortTaskDuration});
      }

      assert.equal(EstimatedInputLatency.calculateRollingWindowEIL(events), 106);
    });
  });
});