/**
 * Analog Clock Widget - Station clock with authentic swinging second hand
 *
 * Drawing logic inspired by stationclock.svg by Rüdiger Appel (ludi.de)
 * Original licensed under Creative Commons
 * React implementation: Canvas UI project
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from '../types';
import type { WidgetMetadata } from '../types/metadata';

// ─── Tick mark helpers ──────────────────────────────────────────────────────

/** Render n evenly-spaced tick marks around the clock face */
function genTicks(
  count: number,
  hourH: number, hourW: number,
  minH: number,  minW: number,
  threeH?: number, threeW?: number
): React.ReactElement[] {
  const marks: React.ReactElement[] = [];
  for (let i = 0; i < count; i++) {
    const angle = i * (360 / count);
    const isThree = threeH !== undefined && i % 15 === 0;
    const isHour  = i % 5  === 0;
    const h = isThree ? threeH! : isHour ? hourH : minH;
    const w = isThree ? threeW! : isHour ? hourW : minW;
    const x = 100 - w / 2;
    marks.push(
      <rect key={i} x={x} y={0} width={w} height={h}
            transform={`rotate(${angle}, 100, 100)`} />
    );
  }
  return marks;
}

// ─── Dial components ────────────────────────────────────────────────────────

const DialBauhaus = React.memo(() => (
  <g>{genTicks(60, 15, 4, 8, 1.5)}</g>
));

const DialAustria = React.memo(() => (
  <g>{genTicks(60, 10, 5, 7, 2.5)}</g>
));

const DialVienna = React.memo(() => {
  const marks: React.ReactElement[] = [];
  for (let i = 0; i < 60; i++) {
    const angle = i * 6;
    const isThree = i % 15 === 0;
    const isHour  = i % 5  === 0;
    if (isThree) {
      marks.push(
        <g key={i} transform={`rotate(${angle}, 100, 100)`}>
          <circle cx="100" cy="3.1" r="3" />
          <polygon points="96.9,3.1 103.1,3.1 110,30 100,40 90,30" />
        </g>
      );
    } else if (isHour) {
      marks.push(
        <g key={i} transform={`rotate(${angle}, 100, 100)`}>
          <circle cx="100" cy="3.1" r="3" />
          <polygon points="96.9,3.1 103.1,3.1 106,15 100,22 94,15" />
        </g>
      );
    } else {
      marks.push(
        <circle key={i} cx="100" cy="3.1" r="3"
                transform={`rotate(${angle}, 100, 100)`} />
      );
    }
  }
  return <g>{marks}</g>;
});

const DialPoints = React.memo(() => {
  const marks: React.ReactElement[] = [];
  for (let i = 0; i < 12; i++) {
    const angle = i * 30;
    const isThree = i % 3 === 0;
    marks.push(
      <circle key={i} cx="100" cy={isThree ? 9 : 6} r={isThree ? 9 : 6}
              transform={`rotate(${angle}, 100, 100)`} />
    );
  }
  return <g>{marks}</g>;
});

const DialDin41091_1 = React.memo(() => (
  <g>{genTicks(60, 24, 8.4, 8, 3.6, 30, 8.4)}</g>
));

const DialDin41091_3 = React.memo(() => {
  const marks: React.ReactElement[] = [];
  for (let i = 0; i < 12; i++) {
    const angle = i * 30;
    const isThree = i % 3 === 0;
    marks.push(
      <rect key={i} x={isThree ? 94 : 95} y={0}
            width={isThree ? 12 : 10} height={isThree ? 30 : 26}
            transform={`rotate(${angle}, 100, 100)`} />
    );
  }
  return <g>{marks}</g>;
});

const DialDin41091_4 = React.memo(() => (
  <g>
    {genTicks(60, 7, 6, 7, 2.5)}
    <g textAnchor="middle" letterSpacing="-2" fontFamily="sans-serif" fontSize="24px" style={{ stroke: 'none' }}>
      <text x="100" y="30">12</text>
      <text x="143" y="41">1</text>
      <text x="171" y="70">2</text>
      <text x="182" y="109">3</text>
      <text x="171" y="147">4</text>
      <text x="142" y="176">5</text>
      <text x="100" y="188">6</text>
      <text x="60"  y="176">7</text>
      <text x="30"  y="147">8</text>
      <text x="18"  y="109">9</text>
      <text x="34"  y="70">10</text>
      <text x="61"  y="41">11</text>
    </g>
  </g>
));

const DialRomanNumerals = React.memo(() => {
  const numerals = ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
  return (
    <g>
      {genTicks(60, 4, 4, 4, 2.5)}
      <g textAnchor="middle" letterSpacing="-3" fontFamily="serif" fontSize="20px" fontWeight={600} style={{ stroke: 'none' }}>
        {numerals.map((n, i) => (
          <text key={i} x="100" y="19" transform={`rotate(${i * 30}, 100, 100) scale(1 1.6)`}>{n}</text>
        ))}
      </g>
    </g>
  );
});

const DialPalmerstone = React.memo(() => {
  const ticks: React.ReactElement[] = [];
  for (let q = 0; q < 4; q++) {
    // 3-hour tick (large) at each quarter
    ticks.push(
      <rect key={`h${q}`} x="97.5" y="0" width="5" height="13"
            transform={`rotate(${q * 90}, 100, 100)`} />
    );
    // minute strokes within each quarter section
    for (let s = 0; s < 2; s++) {           // 2 sub-sections per quarter
      const baseAngle = q * 90 + s * 30;
      // 1 hour stroke at 30°
      ticks.push(
        <rect key={`hs${q}-${s}`} x="97.5" y="0" width="5" height="13"
              transform={`rotate(${baseAngle + 30}, 100, 100)`} />
      );
      // 4 minute strokes
      for (let m = 1; m <= 4; m++) {
        ticks.push(
          <rect key={`ms${q}-${s}-${m}`} x="98.5" y="0" width="3" height="10"
                transform={`rotate(${baseAngle + m * 6}, 100, 100)`} />
        );
        ticks.push(
          <rect key={`ms2${q}-${s}-${m}`} x="98.5" y="0" width="3" height="10"
                transform={`rotate(${baseAngle + 30 + m * 6}, 100, 100)`} />
        );
      }
    }
  }
  return (
    <g style={{ strokeWidth: 0 }}>
      {ticks}
      <circle cx="100" cy="100" r="97.5" style={{ fill: 'none', strokeWidth: 5 }} />
      <circle cx="100" cy="100" r="86"   style={{ fill: 'none', strokeWidth: 4.1 }} />
      <circle cx="100" cy="100" r="60"   style={{ fill: 'none', strokeWidth: 4.1 }} />
      <circle cx="100" cy="100" r="58"   style={{ fill: '#56c1a3', stroke: 'none' }} />
    </g>
  );
});

const DialAubigny = React.memo(() => (
  <g style={{ stroke: 'none' }}>
    <path d="M 95.369523,188.8063 C 96.201007,185.2538 97.721804,178.28322 98.749071,173.3161 C 100.55729,164.57289 100.78542,163.6944 101.14326,164.09685 C 101.33974,164.3178 106.42265,185.07491 107.68036,190.79243 C 108.15579,192.95374 108.43354,194.83335 108.29756,194.96932 C 108.16159,195.1053 107.0819,195.21654 105.89824,195.21654 H 103.74615 L 103.53107,194.42632 C 103.41279,193.9917 102.66491,190.86772 101.86914,187.48412 C 100.49292,181.6325 99.899827,179.85236 99.485023,180.32828 C 99.383063,180.44528 98.508415,183.7922 97.541359,187.76588 L 95.783077,194.99076 L 94.820406,195.12807 L 93.857734,195.26539 Z M 88.031293,190.06321 C 88.40725,183.91868 90.076663,165.47711 90.375072,164.1721 L 90.607395,163.1561 H 92.604142 C 93.702354,163.1561 94.701738,163.31927 94.824997,163.51871 C 94.948257,163.71816 94.756653,166.91856 94.39921,170.63071 C 94.041769,174.34288 93.442902,180.8345 93.068396,185.05654 C 92.693888,189.2786 92.284014,193.19019 92.157562,193.74898 L 91.927649,194.76498 H 89.835631 H 87.743613 Z M 60.11019,186.83177 C 59.365124,186.44525 58.585504,185.96153 58.377702,185.75682 L 57.999882,185.38463 L 59.581708,180.47926 C 61.464356,174.641 62.692786,169.99989 62.504271,169.43756 C 62.429304,169.21394 59.847208,171.88437 56.76628,175.37183 L 51.16459,181.71268 L 50.52046,181.4655 C 50.166186,181.32955 49.776599,181.21832 49.654707,181.21832 C 49.272086,181.21832 51.217065,178.87533 54.90257,174.89654 C 56.857988,172.78553 61.257032,167.76224 64.678222,163.7337 C 68.099413,159.70516 70.946373,156.45687 71.0048,156.51531 C 71.247265,156.75778 63.823411,183.17695 62.632957,186.30807 C 62.089161,187.73837 61.923903,187.77268 60.11019,186.83177 Z M 138.98412,184.9711 C 138.31975,183.72288 136.03053,176.18984 135.884,174.76963 C 135.81274,174.07894 135.41518,172.85974 135.00055,172.0603 C 134.58592,171.26085 133.87683,169.28597 133.42478,167.67166 C 132.97273,166.05735 131.88261,162.62489 131.00228,160.04397 C 130.12196,157.46306 129.49068,155.26243 129.59943,155.15368 C 129.70816,155.04493 131.38957,156.64693 133.33589,158.71365 C 135.28219,160.78039 138.81646,164.50503 141.1898,166.99062 C 143.56315,169.47621 146.89394,172.97837 148.59155,174.77319 L 151.67815,178.0365 L 151.1268,178.70083 C 150.82357,179.06621 149.88859,179.77041 149.04908,180.26573 L 147.5227,181.16631 L 146.33402,179.72477 C 144.67213,177.70935 137.00825,169.929 136.68731,169.93146 C 136.54198,169.93257 136.38414,170.68085 136.33654,171.59428 L 136.25001,173.25509 L 136.86185,173.73716 C 138.34985,180.33645 140.10028,181.96959 140.34238,184.12505 L 140.48708,185.41337 L 139.95321,185.60107 Z M 9.3264615,133.38384 C 9.069577,132.90384 8.6664372,132.00359 8.4305946,131.38327 L 8.0017895,130.25544 L 21.962741,122.99911 C 29.641263,119.00812 36.102394,115.74277 36.320806,115.74277 C 36.539219,115.74277 37.087482,116.56231 37.539168,117.56397 L 38.360415,119.38517 L 37.946414,119.76665 C 37.718714,119.97645 35.703613,121.11299 33.468413,122.29227 C 31.233215,123.47156 27.778815,125.29837 25.791971,126.35186 C 14.787653,132.18674 10.727433,134.25655 10.285845,134.25655 C 10.015068,134.25655 9.583346,133.86382 9.3264615,133.38384 Z M 5.5472308,109.11997 C 5.3816602,108.95438 5.246194,107.95454 5.246194,106.89806 V 104.97719 L 6.4879706,104.75017 C 7.1709492,104.6253 14.282948,104.52398 22.292415,104.52502 L 36.855081,104.5269 V 106.97396 V 109.421 H 21.351674 C 12.8248,109.421 5.7128013,109.28553 5.5472308,109.11997 Z M 163.29063,106.48588 V 104.00233 H 179.3583 H 195.42597 L 195.18299,106.373 C 195.04936,107.67687 194.93091,108.79446 194.91977,108.85655 C 194.90864,108.91863 187.78752,108.96944 179.09507,108.96944 H 163.29063 Z" />
  </g>
));

// Wandelhalle dial - ornate German railway station numerals
const DialWandelhalle = React.memo(() => (
  <g transform="matrix(0.462331,0,0,0.46431,-36.7893,-96.9708)" style={{ fillRule: 'nonzero', stroke: 'none' }}>
    <path d="M276.437,627.909C268.496,626.457 266.372,624.64 271.73,623.884C274.625,623.475 274.882,622.362 277.682,598.059C281.248,567.116 281.359,563.376 278.79,560.822C275.712,557.763 276.316,557.379 281.816,558.897C284.69,559.691 293.396,560.007 302.057,559.631L317.254,558.973L313.125,561.469C309.953,563.386 309.155,564.665 309.684,566.977C310.063,568.633 312.519,581.718 315.141,596.054C319.941,622.289 321.107,625.33 326.451,625.546C327.645,625.594 327.135,626.192 325.268,626.933C320.441,628.85 285.407,629.55 276.437,627.909ZM290.625,624.42C292.123,622.774 293.443,616.292 294.911,603.367C296.078,593.095 297.537,580.782 298.153,576.003C298.77,571.224 298.982,566.546 298.624,565.607C297.486,562.618 293.486,561.255 291.051,563.025C289.272,564.318 288.224,570.472 285.885,593.383C284.271,609.188 283.357,623.172 283.854,624.459C285.014,627.462 287.87,627.445 290.625,624.42ZM309.672,624.177C311.962,621.663 311.913,620.702 308.46,600.451C306.482,588.843 304.382,577.841 303.795,576.003L302.728,572.661L301.916,576.672C301.47,578.877 300.077,589.856 298.82,601.07C296.626,620.635 296.632,621.566 298.965,624.128C302.056,627.523 306.607,627.544 309.672,624.177ZM216.93,614.058C202.697,607.907 186.796,598.709 174.889,589.737C163.332,581.029 162.307,579.74 167.364,580.278C170.85,580.648 172.636,578.756 189.055,557.289C205.267,536.094 206.886,533.482 206.295,529.477L205.644,525.057L210.154,528.994C217.629,535.517 226.29,541.005 239.977,547.891C252.944,554.415 252.962,554.431 247.801,554.857L242.627,555.284L233.549,581.35C228.556,595.686 224.438,608.572 224.398,609.984C224.359,611.397 225.331,613.656 226.559,615.005C227.787,616.354 228.52,617.728 228.187,618.059C227.854,618.39 222.789,616.589 216.93,614.058ZM381.171,607.336C383.369,604.001 383.174,603.245 373.537,577.756C368.097,563.37 362.765,550.722 361.686,549.65C360.608,548.578 358.308,547.971 356.576,548.3C351.836,549.2 352.787,547.393 358.469,544.704C361.243,543.391 366.084,540.593 369.227,538.486C375.157,534.512 376.267,534.718 372.883,539.165C371.797,540.592 370.908,542.178 370.908,542.688C370.908,543.199 379.142,554.062 389.206,566.828C405.731,587.791 407.881,590.02 411.395,589.842C413.535,589.733 415.286,590.044 415.286,590.531C415.286,592.559 384.171,610.7 380.627,610.739C379.385,610.753 379.534,609.818 381.171,607.336Z" />
  </g>
));

// ─── Hand components ─────────────────────────────────────────────────────────

// Hour hands
const HourHandBauhaus    = () => <polygon points="95,32 105,32 106.5,126 93.5,126" style={{ stroke: 'none' }} />;
const HourHandGerman     = () => <rect x="95" y="40" width="10" height="65" style={{ stroke: 'none' }} />;
const HourHandSiemens    = () => <g style={{ stroke: 'none' }}>
  <rect x="97.3" y="65" width="5.4" height="35" />
  <circle cx="97.3" cy="58.5" r="9" />
  <circle cx="102.7" cy="58.5" r="9" />
  <path d="M 88.3,58.5 Q 88.3,52 100,37.5 Q 111.7,52 111.7,58.5 Z" />
  <path d="M 93.5,123 Q 100,125.5 106.5,123 Q 103,116 102.7,100 L 97.3,100 Q 97.3,116 93.5,123 Z" />
  <circle cx="100" cy="100" r="7.4" />
</g>;
const HourHandSiemens2   = () => <path d="M 100,36 Q 120,60 103,64 L 103,100 Q 104,120 107,124 Q 100,127 93,124 Q 96,120 97,100 L 97,64 Q 80,60 100,36 Z" style={{ stroke: 'none' }} />;
const HourHandDin41092_3 = () => <polygon points="94,46 100,40 106,46 106,118 94,118" style={{ stroke: 'none' }} />;
const HourHandBigBang    = () => <g style={{ stroke: 'none' }}>
  <path d="M 100,38 L 93,114 L 100,107 L 107,114 Z" />
  <path d="M 100,93 L 86,100 L 100,107 L 114,100 Z" />
</g>;
const HourHandWandelhalle = () => <g style={{ stroke: 'none', fillRule: 'evenodd' }}>
  <path d="M 100.5,35 C 100.5,45 107.5,47 107.5,53.5 L 102.5,53.5 L 102.5,55 C 116,50 116,70 102.5,65 L 102.5,132 L 97.5,132 L 97.5,65 C 84,70 84,50 97.5,55 L 92.5,53.5 C 92.5,47 99.5,45 99.5,35 M 110.5,58.5 A 4 2.5 0 1 0 110.5,58.51 M 97.5,58.5 A 4 2.5 0 1 0 97.5,58.51 Z" />
  <ellipse cx="100" cy="53.5" rx="7.5" ry="7.5" />
  <ellipse cx="100" cy="62.5" rx="4.5" ry="4.5" />
  <ellipse cx="104.5" cy="129.5" rx="3.5" ry="3.5" />
  <ellipse cx="95.5"  cy="129.5" rx="3.5" ry="3.5" />
  <ellipse cx="100"   cy="134.5" rx="4.5" ry="4.5" />
</g>;
const HourHandZurichEnge = () => <g style={{ stroke: 'none', fillRule: 'evenodd' }}>
  <ellipse cx="100" cy="124" rx="4" ry="4" />
  <path d="M 102.5,62 L 102.5,124 L 97.5,124 L 97.5,62 Z" />
  <path d="M 100.7,30 L 102,46 L 100,50 L 98,46 Z" />
  <path d="M 110 55 A 10 10 0 1 0 110 55.01 Z M 93 53.5 A 7 7 0 1 0 93 53.01 Z" />
</g>;
const HourHandOttensen = () => <path style={{ stroke: 'none' }} d="M 102.2,38 L 102.5,50 Q 102.5,56 110,64 Q 103,72 103,78 L 103.5,100 Q 103.5,120 108,129 L 107.5,130 Q 100,123 92.5,130 L 92,129 Q 96.5,120 96.5,100 L 97,78 Q 97,72 90,64 Q 97.5,56 97.5,50 L 97.8,38 Q 100,34 102.2,38 M 100,55 Q 100,58 95,64 Q 100,70 100,73 Q 100,70 105,64 Q 100,58 100,55 Z" />;
const HourHandNewYork = () => <g style={{ stroke: 'none' }}>
  <ellipse cx="100" cy="100" rx="8" ry="8" />
  <path d="M 101,22 Q 103.2,36 109.5,37.8 L 110,43 Q 103.2,43 103.2,39.5 L 104.4,73.5 L 107,73.5 L 107,76 L 109.3,76 L 109.3,79 L 107,79 L 107,81.5 L 104.5,81.5 L 104.8,100 L 104.5,118.5 L 107,118.5 L 107,121 L 109.3,121 L 109.3,124 L 107,124 L 107,126.5 L 105,126.5 L 105,135 L 102,148 Q 100,150 98,148 L 95,135 L 95,126.5 L 93,126.5 L 93,124 L 90.7,124 L 90.7,121 L 93,121 L 93,118.5 L 95.5,118.5 L 95.2,100 L 95.5,81.5 L 93,81.5 L 93,79 L 90.7,79 L 90.7,76 L 93,76 L 93,73.5 L 95.6,73.5 L 96.8,39.5 Q 96.8,43 90,43 L 90.5,37.8 Q 96.8,36 99,22 Z" />
</g>;
const HourHandSamurai = () => <path style={{ stroke: 'none' }} d="M 97,34 Q 99,35 103,31 Q 102,70 103,110 Q 101,110 97,112 Q 101,75 97,34 Z" />;
const HourHandWestminster = () => <g style={{ stroke: 'none' }}>
  <ellipse cx="100" cy="100" rx="6" ry="6" />
  <ellipse cx="103.5" cy="79.6" rx="1.6" ry="1.6" />
  <ellipse cx="96.5"  cy="79.6" rx="1.6" ry="1.6" />
  <path d="M 103.5,52 L 102.5,55 Q 115,68 104.5,70 L 103.5,70 L 103.5,80 Q 103.5,86 107.5,86 L 107.5,87 Q 103.5,87 103.5,93 L 103.5,100 C 103.5,118 106.5,108 106.5,116 Q 106.5,120 100,122 Q 93.5,120 93.5,116 C 93.5,108 96.5,118 96.5,100 L 96.5,93 Q 96.5,87 92.5,87 L 92.5,86 Q 96.5,86 96.5,80 L 96.5,70 L 95.5,70 Q 85,68 97.5,55 L 96.5,52 Q 100,44 103.5,52 Z" />
</g>;
const HourHandAubigny = () => <g style={{ stroke: 'none', fillRule: 'evenodd' }}>
  <ellipse cx="100" cy="100" rx="7.5" ry="7.5" />
  <path d="M 102,26 L 102.8,43 L 106,40 C 103,49 113,56 109,61 L 111,63 Q 102,64 105,69 C 102.5,69 102.5,95 104,95 L 106,95 Q 101,99 107.5,100 L 92.5,100 Q 99,99 94,95 L 96,95 C 97.5,95 97.5,69 95,69 Q 98,64 89,63 L 91,61 C 87,56 97,49 94,40 L 97.2,43 L 98,26 Q 100,25 102,26 M 100,59 L 102.8,63 L 101.5,68 L 98.5,68 L 97.2,63 M 100,56 L 102.9,52 L 101.4,45 L 98.6,45 L 97.1,52 M 107.5 57.5 A 2.5 2.5 0 1 0 107.5 57.51 M 97.5 57.5 A 2.5 2.5 0 1 0 97.5 57.51 Z" />
</g>;
const HourHandVienna = () => <path style={{ stroke: 'none' }} d="M 98,28 L 92,44 L 85,55 L 94,70 L 97,100 L 90,120 L 95,123 L 97,120 L 103,120 L 105,123 L 110,120 L 103,100 L 106,70 L 115,55 L 108,44 L 102,28 Z" />;
const HourHandPalmerstone = () => <g>
  <circle cx="100" cy="100" r="8" />
  <g transform="matrix(1,0,0,0.733333,0,26.6667)">
    <rect x="98" y="40" width="4" height="60" style={{ stroke: 'black', strokeWidth: '0.57px' }} />
  </g>
  <g transform="matrix(0.944941,-6.74275e-18,6.74275e-18,-1,32.0833,82.3346)">
    <path d="M71.874,24.335C72.291,28.152 71.902,41.752 71.874,44.835C70.505,42.164 70.132,41.289 67.993,38.904C66.239,36.946 66.161,36.975 62.875,33.789C59.19,30.217 59.348,25.847 61.917,23.789C63.216,22.748 64.758,22.472 66.708,22.789C69.568,23.255 69.964,23.856 71.874,24.335Z" />
  </g>
  <g transform="matrix(-0.944941,-6.74275e-18,-6.74275e-18,-1,167.908,82.3346)">
    <path d="M71.864,24.335C72.281,28.152 71.85,42.218 71.864,44.835C70.495,42.164 70.132,41.289 67.993,38.904C66.239,36.946 66.161,36.975 62.875,33.789C59.19,30.217 59.348,25.847 61.917,23.789C63.216,22.748 64.758,22.472 66.708,22.789C69.568,23.255 69.955,23.856 71.864,24.335Z" />
  </g>
</g>;

// Minute hands
const MinuteHandBauhaus    = () => <polygon points="96.5,7 103.5,7 105,125 95,125" style={{ stroke: 'none' }} />;
const MinuteHandGerman     = () => <rect x="96" y="6" width="8" height="99" style={{ stroke: 'none' }} />;
const MinuteHandSiemens    = () => <g style={{ stroke: 'none' }}>
  <polygon points="95.3,49 99.5,2 100.5,2 104.7,49 102.7,100 97.3,100" />
  <path d="M 93.5,123 Q 100,125.5 106.5,123 Q 103,116 102.7,100 L 97.3,100 Q 97.3,116 93.5,123 Z" />
  <circle cx="100" cy="100" r="7" />
</g>;
const MinuteHandSiemens2   = () => <path style={{ stroke: 'none' }} d="M 100,5 Q 108,55 102.8,100 Q 104,120 107,124 Q 100,127 93,124 Q 96,120 97.2,100 Q 92,55 100,5 Z" />;
const MinuteHandDin41092_3 = () => <polygon points="95.5,11.5 100,7 104.5,11.5 104.5,122 95.5,122" style={{ stroke: 'none' }} />;
const MinuteHandBigBang    = () => <path style={{ stroke: 'none' }} d="M 100,18 Q 94,50 96,103 Q 100,85 104,103 Q 106,50 100,18 Z" />;
const MinuteHandWandelhalle = () => <g style={{ stroke: 'none' }}>
  <path d="M 100.5,5 C 100,35 110,35 102.5,46 L 102.5,132 L 97.5,132 L 97.5,46 C 90,35 100,35 99.5,5 Z" />
  <ellipse cx="104.5" cy="129.5" rx="3.5" ry="3.5" />
  <ellipse cx="95.5"  cy="129.5" rx="3.5" ry="3.5" />
  <ellipse cx="100"   cy="134.5" rx="4.5" ry="4.5" />
</g>;
const MinuteHandZurichEnge = () => <g style={{ stroke: 'none' }}>
  <ellipse cx="100" cy="130" rx="4" ry="4" />
  <path d="M 100,0 Q 100,2 106,7 Q 101.8,7 102.3,5 L 102.3,130 L 97.7,130 L 97.7,5 Q 98.2,7 94,7 Q 100,2 100,0 Z" />
</g>;
const MinuteHandOttensen = () => <path style={{ stroke: 'none' }} d="M 102.2,4 L 102.5,26 Q 102.5,32 110,40 Q 103,48 103,54 L 103.5,100 Q 103.5,120 108,129 L 107.5,130 Q 100,123 92.5,130 L 92,129 Q 96.5,120 96.5,100 L 97,54 Q 97,48 90,40 Q 97.5,32 97.5,26 L 97.8,4 Q 100,0 102.2,4 M 100,31 Q 100,34 95,40 Q 100,46 100,49 Q 100,46 105,40 Q 100,34 100,31 Z" />;
const MinuteHandNewYork = () => <g style={{ stroke: 'none' }}>
  <ellipse cx="100" cy="100" rx="6" ry="6" />
  <path d="M 101,0 L 102.2,15 L 103,15 L 103,13 L 106,13 L 106,15 Q 100,20 107,25 L 107,27 L 103,27 L 103,25 L 102.2,25 L 102.7,69 L 105,69 L 105,71 L 107,71 L 107,74 L 105,74 L 105,76 L 102.7,76 L 103,100 L 102,147 Q 100,150 98,147 L 97,100 L 97.3,76 L 95,76 L 95,74 L 93,74 L 93,71 L 95,71 L 95,69 L 97.3,69 L 97.8,25 L 97,25 L 97,27 L 93,27 L 93,25 Q 100,20 94,15 L 94,13 L 97,13 L 97,15 L 97.8,15 L 99,0 Z" />
</g>;
const MinuteHandSamurai = () => <path style={{ stroke: 'none' }} d="M 97.5,10 Q 101.5,10 102.5,8 Q 109,40 102,110 Q 101,110 98,112 Q 108,50 98,10 Z" />;
const MinuteHandWestminster = () => <g style={{ stroke: 'none' }}>
  <ellipse cx="100" cy="100" rx="5" ry="5" />
  <path d="M 102,3 L 103.5,100 Q 104,115 107,118 L 107.4,122 Q 103,121 100,125 Q 97,121 92.6,122 L 93,118 Q 96,115 96.5,100 L 98,3 Q 100,0 102,3 Z" />
</g>;
const MinuteHandAubigny = () => <g style={{ stroke: 'none', fillRule: 'evenodd' }}>
  <ellipse cx="100" cy="100" rx="7.5" ry="7.5" />
  <path d="M 102.4,5 L 102.8,30 L 106,30 C 103,36 113,43 109,48 L 111,50 Q 102,51 105,59 C 102.5,59 102.5,85 104,85 L 106,85 Q 101,89 107.5,100 L 92.5,100 Q 99,89 94,85 L 96,85 C 97.5,85 97.5,59 95,59 Q 98,51 89,50 L 91,48 C 87,43 97,36 94,30 L 97.2,30 L 97.6,5 Q 100,3 102.4,5 M 100,46 L 102.8,50 L 101.5,55 L 98.5,55 L 97.2,50 M 100,43 L 102.8,39 L 101.5,34 L 98.5,34 L 97.2,39 M 107.5 44.5 A 2.5 2.5 0 1 0 107.5 44.51 M 97.5 44.5 A 2.5 2.5 0 1 0 97.5 44.51 Z" />
</g>;
const MinuteHandVienna = () => <path style={{ stroke: 'none' }} d="M 98,2 L 91,30 L 97,100 L 95,120 L 99,140 L 101,140 L 105,120 L 103,100 L 109,30 L 102,2 Z" />;
const MinuteHandPalmerstone = () => <g>
  <circle cx="100" cy="100" r="8" />
  <path d="M100,10L98,40L98,100L100,100L100,10Z" style={{ stroke: 'black', strokeWidth: '0.5px' }} />
  <g transform="matrix(-1,0,0,1,200,0)">
    <path d="M100,10L98,40L98,100L100,100L100,10Z" style={{ stroke: 'black', strokeWidth: '0.5px' }} />
  </g>
</g>;

// Second hands
const SecondHandBar       = () => <line x1="100" y1="5"  x2="100" y2="100" style={{ strokeWidth: 3.5, strokeLinecap: 'butt' }} />;
const SecondHandBauhaus   = () => <g>
  <line x1="100" y1="40" x2="100" y2="135" style={{ strokeWidth: 3.5, strokeLinecap: 'butt' }} />
  <path d="M 90,34 a 10,10 0 1 0 20,0 M 110,34 a 10,10 0 1 0 -20,0 M 94,30 a 6,6 0 1 0 12,0 M 106,30 a 6,6 0 1 0 -12,0 Z" style={{ stroke: 'none', fillRule: 'evenodd' }} />
</g>;
const SecondHandGerman    = () => <g style={{ stroke: 'none' }}>
  <polygon points="98,4 102,4 102.3,36 97.7,36" />
  <circle cx="100" cy="45" r="10" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 4 }} />
  <polygon points="97.5,56 102.5,55 103,102 97,102" />
</g>;
const SecondHandDin41071_1 = () => <polygon points="99.4,8 100.6,8 102.8,123 97.2,123" style={{ stroke: 'none' }} />;
const SecondHandDin41071_2 = () => <g style={{ stroke: 'none' }}>
  <polygon points="98.8,11 100,9.8 101.2,11 101.6,42 98.4,42" />
  <polygon points="98.1,58 101.9,58 102.5,122 97.5,122" />
  <circle cx="100" cy="50" r="8.5" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 6.5 }} />
</g>;
const SecondHandBigBang   = () => <path style={{ stroke: 'none' }} d="M 100,10 L 101.5,42 L 105,40 L 100,70 L 98.5,50 L 95,52 Z" />;
const SecondHandWandelhalle = () => <g style={{ stroke: 'none' }}>
  <path d="M 100.5,18 C 100,45 110,45 102,46 L 102,132 L 98,132 L 98,46 C 90,45 100,45 99.5,18 Z" />
  <ellipse cx="103.5" cy="128.5" rx="2.5" ry="2.5" />
  <ellipse cx="96.5"  cy="128.5" rx="2.5" ry="2.5" />
  <ellipse cx="100"   cy="132.5" rx="3.5" ry="3.5" />
</g>;
const SecondHandSamurai   = () => <path style={{ stroke: 'none' }} d="M 98.5,10 Q 101,7 101.5,8 Q 106,50 101.5,110 Q 100.5,110 96.5,112 Q 101.5,70 99,10 Z" />;
const SecondHandSwiss     = () => <g>
  <line x1="100" y1="34" x2="100" y2="135" style={{ strokeWidth: 3.5, strokeLinecap: 'butt' }} />
  <circle cx="100" cy="34" r="10" style={{ stroke: 'none' }} />
</g>;

// Blank dial — renders nothing so hands can overlay a background image
const DialNone = React.memo(() => <g />);

// ─── Hand/Dial selector maps ──────────────────────────────────────────────────

const HOUR_HANDS: Record<string, React.FC> = {
  bauhaus: HourHandBauhaus, german: HourHandGerman, siemens: HourHandSiemens,
  siemens2: HourHandSiemens2, din41092_3: HourHandDin41092_3, bigbang: HourHandBigBang,
  wandelhalle: HourHandWandelhalle, zurichenge: HourHandZurichEnge, ottensen: HourHandOttensen,
  newyork: HourHandNewYork, samurai: HourHandSamurai, westminster: HourHandWestminster,
  aubigny: HourHandAubigny, vienna: HourHandVienna, palmerstone: HourHandPalmerstone,
};
const MINUTE_HANDS: Record<string, React.FC> = {
  bauhaus: MinuteHandBauhaus, german: MinuteHandGerman, siemens: MinuteHandSiemens,
  siemens2: MinuteHandSiemens2, din41092_3: MinuteHandDin41092_3, bigbang: MinuteHandBigBang,
  wandelhalle: MinuteHandWandelhalle, zurichenge: MinuteHandZurichEnge, ottensen: MinuteHandOttensen,
  newyork: MinuteHandNewYork, samurai: MinuteHandSamurai, westminster: MinuteHandWestminster,
  aubigny: MinuteHandAubigny, vienna: MinuteHandVienna, palmerstone: MinuteHandPalmerstone,
};
const SECOND_HANDS: Record<string, React.FC> = {
  bar: SecondHandBar, bauhaus: SecondHandBauhaus, german: SecondHandGerman,
  din41071_1: SecondHandDin41071_1, din41071_2: SecondHandDin41071_2, bigbang: SecondHandBigBang,
  wandelhalle: SecondHandWandelhalle, samurai: SecondHandSamurai, swiss: SecondHandSwiss,
};
const DIALS: Record<string, React.FC> = {
  bauhaus: DialBauhaus, austria: DialAustria, vienna: DialVienna, points: DialPoints,
  din41091_1: DialDin41091_1, din41091_3: DialDin41091_3, din41091_4: DialDin41091_4,
  romannumerals: DialRomanNumerals, palmerstone: DialPalmerstone,
  aubigny: DialAubigny, wandelhalle: DialWandelhalle,
  none: DialNone,
};

function makePolygonPoints(sides: number, radius: number): string {
  let angle = 2 * Math.PI / (sides * 2);
  let points = '';
  for (let i = 0; i < sides; i++) {
    points += `${100 + radius * Math.sin(angle)},${100 + radius * Math.cos(angle)} `;
    angle += 2 * Math.PI / sides;
  }
  return points.trim();
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const analogClockMetadata: WidgetMetadata = {
  name: 'Analog Clock',
  icon: 'Schedule',
  category: 'display',
  description: 'Station-style analog clock with authentic swinging second hand and many dial/hand variants',
  defaultSize: { w: 300, h: 300 },
  minSize: { w: 100, h: 100 },
  requiresEntity: false,
  fields: [
    // Layout
    { name: 'x',      type: 'number', label: 'X Position', default: 0, category: 'layout' },
    { name: 'y',      type: 'number', label: 'Y Position', default: 0, category: 'layout' },
    { name: 'width',  type: 'number', label: 'Width',      default: 300, min: 100, category: 'layout' },
    { name: 'height', type: 'number', label: 'Height',     default: 300, min: 100, category: 'layout' },

    // Behavior
    { name: 'secondHandBehavior', type: 'select', label: 'Second Hand',   default: 'swinging', category: 'behavior',
      options: [{ value: 'swinging', label: 'Swinging (station clock)' }, { value: 'stepping', label: 'Stepping' }, { value: 'sweeping', label: 'Sweeping' }] },
    { name: 'minuteHandBehavior', type: 'select', label: 'Minute Hand',   default: 'stepping', category: 'behavior',
      options: [{ value: 'stepping', label: 'Stepping' }, { value: 'sweeping', label: 'Sweeping' }] },
    { name: 'secondHandStopTime', type: 'slider', label: 'Pause Time (s)', default: 1.5, min: 0, max: 5, step: 0.1, category: 'behavior' },

    // Dial style
    { name: 'dial', type: 'select', label: 'Dial Style', default: 'bauhaus', category: 'style',
      options: [
        { value: 'bauhaus',      label: 'Bauhaus'       },
        { value: 'austria',      label: 'Austria'       },
        { value: 'vienna',       label: 'Vienna'        },
        { value: 'points',       label: 'Points'        },
        { value: 'din41091_1',   label: 'DIN 41091.1'   },
        { value: 'din41091_3',   label: 'DIN 41091.3'   },
        { value: 'din41091_4',   label: 'DIN 41091.4'   },
        { value: 'romannumerals',label: 'Roman Numerals'},
        { value: 'palmerstone',  label: 'Palmerstone'   },
        { value: 'aubigny',      label: 'Aubigny'       },
        { value: 'wandelhalle',  label: 'Wandelhalle'   },
        { value: 'none',         label: 'None (image overlay)' },
      ]},

    // Hand styles
    { name: 'hourHand', type: 'select', label: 'Hour Hand', default: 'din41092_3', category: 'style',
      options: [
        { value: 'bauhaus',      label: 'Bauhaus'      }, { value: 'german',       label: 'German'       },
        { value: 'siemens',      label: 'Siemens'      }, { value: 'siemens2',     label: 'Siemens 2'    },
        { value: 'din41092_3',   label: 'DIN 41092.3'  }, { value: 'bigbang',      label: 'Big Bang'     },
        { value: 'wandelhalle',  label: 'Wandelhalle'  }, { value: 'zurichenge',   label: 'Zürich Enge'  },
        { value: 'ottensen',     label: 'Ottensen'     }, { value: 'newyork',      label: 'New York'     },
        { value: 'samurai',      label: 'Samurai'      }, { value: 'westminster',  label: 'Westminster'  },
        { value: 'aubigny',      label: 'Aubigny'      }, { value: 'vienna',       label: 'Vienna'       },
        { value: 'palmerstone',  label: 'Palmerstone'  },
      ]},
    { name: 'minuteHand', type: 'select', label: 'Minute Hand', default: 'din41092_3', category: 'style',
      options: [
        { value: 'bauhaus',      label: 'Bauhaus'      }, { value: 'german',       label: 'German'       },
        { value: 'siemens',      label: 'Siemens'      }, { value: 'siemens2',     label: 'Siemens 2'    },
        { value: 'din41092_3',   label: 'DIN 41092.3'  }, { value: 'bigbang',      label: 'Big Bang'     },
        { value: 'wandelhalle',  label: 'Wandelhalle'  }, { value: 'zurichenge',   label: 'Zürich Enge'  },
        { value: 'ottensen',     label: 'Ottensen'     }, { value: 'newyork',      label: 'New York'     },
        { value: 'samurai',      label: 'Samurai'      }, { value: 'westminster',  label: 'Westminster'  },
        { value: 'aubigny',      label: 'Aubigny'      }, { value: 'vienna',       label: 'Vienna'       },
        { value: 'palmerstone',  label: 'Palmerstone'  },
      ]},
    { name: 'secondHand', type: 'select', label: 'Second Hand', default: 'swiss', category: 'style',
      options: [
        { value: 'bar',          label: 'Bar'          }, { value: 'bauhaus',      label: 'Bauhaus'      },
        { value: 'german',       label: 'German'       }, { value: 'din41071_1',   label: 'DIN 41071.1'  },
        { value: 'din41071_2',   label: 'DIN 41071.2'  }, { value: 'bigbang',      label: 'Big Bang'     },
        { value: 'wandelhalle',  label: 'Wandelhalle'  }, { value: 'samurai',      label: 'Samurai'      },
        { value: 'swiss',        label: 'Swiss'        },
      ]},
    { name: 'axisCover', type: 'select', label: 'Axis Cover', default: 'circle', category: 'style',
      options: [
        { value: 'circle',   label: 'Circle'   },
        { value: 'hexagon',  label: 'Hexagon'  },
        { value: 'octagon',  label: 'Octagon'  },
        { value: 'none',     label: 'None'     },
      ]},

    // Colors
    { name: 'backgroundColor',  type: 'color', label: 'Background',   default: 'transparent',  category: 'style' },
    { name: 'dialColor',        type: 'color', label: 'Dial',          default: '#505050',      category: 'style' },
    { name: 'hourHandColor',    type: 'color', label: 'Hour Hand',     default: '#212121',      category: 'style' },
    { name: 'minuteHandColor',  type: 'color', label: 'Minute Hand',   default: '#212121',      category: 'style' },
    { name: 'secondHandColor',  type: 'color', label: 'Second Hand',   default: '#d11e00',      category: 'style' },
    { name: 'axisCoverColor',   type: 'color', label: 'Axis Cover',    default: '#d11e00',      category: 'style' },

    // Shadow
    { name: 'shadowOpacity', type: 'slider', label: 'Shadow Opacity', default: 0.5,  min: 0, max: 1,  step: 0.05, category: 'style' },
    { name: 'shadowOffsetX', type: 'slider', label: 'Shadow X',       default: 3,    min: -10, max: 10, step: 1, category: 'style' },
    { name: 'shadowOffsetY', type: 'slider', label: 'Shadow Y',       default: 3,    min: -10, max: 10, step: 1, category: 'style' },
    { name: 'shadowBlur',    type: 'slider', label: 'Shadow Blur',    default: 1,    min: 0, max: 10, step: 0.5, category: 'style' },
    { name: 'axisCoverRadius', type: 'slider', label: 'Axis Cover Radius', default: 9, min: 2, max: 20, step: 1, category: 'style' },
  ],
};

// ─── Main widget ──────────────────────────────────────────────────────────────

const AnalogClockWidget: React.FC<WidgetProps> = ({ config }) => {
  const cfg = config.config || {};

  // Options with defaults
  const dial               = (cfg.dial               ?? 'bauhaus'    ) as string;
  const hourHand           = (cfg.hourHand           ?? 'din41092_3' ) as string;
  const minuteHand         = (cfg.minuteHand         ?? 'din41092_3' ) as string;
  const secondHand         = (cfg.secondHand         ?? 'swiss'      ) as string;
  const axisCoverType      = (cfg.axisCover          ?? 'circle'     ) as string;
  const backgroundColor    = (cfg.backgroundColor    ?? 'transparent') as string;
  const dialColor          = (cfg.dialColor          ?? '#505050'    ) as string;
  const hourHandColor      = (cfg.hourHandColor      ?? '#212121'    ) as string;
  const minuteHandColor    = (cfg.minuteHandColor    ?? '#212121'    ) as string;
  const secondHandColor    = (cfg.secondHandColor    ?? '#d11e00'    ) as string;
  const axisCoverColor     = (cfg.axisCoverColor     ?? '#d11e00'    ) as string;
  const shadowOpacity      = parseFloat(String(cfg.shadowOpacity ?? 0.5));
  const shadowOffsetX      = parseFloat(String(cfg.shadowOffsetX ?? 3));
  const shadowOffsetY      = parseFloat(String(cfg.shadowOffsetY ?? 3));
  const shadowBlur         = parseFloat(String(cfg.shadowBlur    ?? 1));
  const axisCoverRadius    = parseFloat(String(cfg.axisCoverRadius ?? 9));
  const secondHandBehavior = (cfg.secondHandBehavior ?? 'swinging'  ) as string;
  const minuteHandBehavior = (cfg.minuteHandBehavior ?? 'stepping'  ) as string;
  const secondHandStopTime = parseFloat(String(cfg.secondHandStopTime ?? 1.5));

  const [hourAngle,   setHourAngle  ] = useState(0);
  const [minuteAngle, setMinuteAngle] = useState(0);
  const [secondAngle, setSecondAngle] = useState(0);

  const behaviorRef = useRef({ secondHandBehavior, minuteHandBehavior, secondHandStopTime });
  behaviorRef.current = { secondHandBehavior, minuteHandBehavior, secondHandStopTime };

  useEffect(() => {
    const tick = () => {
      const now     = new Date();
      const hours   = now.getHours() % 12;
      const minutes = now.getMinutes();
      const rawSecs = now.getSeconds();
      const millis  = now.getMilliseconds();
      const { secondHandBehavior: sB, minuteHandBehavior: mB, secondHandStopTime: stopTime } = behaviorRef.current;

      setHourAngle(30 * hours + 0.5 * minutes);
      setMinuteAngle(6 * minutes + (mB === 'sweeping' ? 0.1 * rawSecs : 0));

      // Swinging second hand math (from original stationclock.svg by Rüdiger Appel)
      const fact    = 60 / (60 - Math.min(30, Math.max(0, stopTime)));
      const time    = Math.min(60000, fact * (1000 * rawSecs + millis));
      const s       = Math.floor(time / 1000);
      const m       = time % 1000;
      let sa        = 6 * s;
      if (sB === 'sweeping') {
        sa += 0.006 * m;
      } else if (sB === 'swinging') {
        sa += 3 * (1 + Math.cos(Math.PI + Math.PI * 0.001 * m));
      }
      setSecondAngle(sa);
    };

    tick();
    const timerId = setInterval(tick, 25);
    return () => clearInterval(timerId);
  }, []); // run once; behavior values read via ref

  // Resolve dial and hand components
  const DialComp        = DIALS[dial]        ?? DialBauhaus;
  const HourHandComp    = HOUR_HANDS[hourHand]    ?? HourHandDin41092_3;
  const MinuteHandComp  = MINUTE_HANDS[minuteHand]  ?? MinuteHandDin41092_3;
  const SecondHandComp  = SECOND_HANDS[secondHand]  ?? SecondHandSwiss;

  // Axis cover polygon points (computed)
  const hexPoints = useMemo(() => makePolygonPoints(6, axisCoverRadius), [axisCoverRadius]);
  const octPoints = useMemo(() => makePolygonPoints(8, axisCoverRadius), [axisCoverRadius]);

  const filterId = `acw-shadow-${React.useId().replace(/:/g, '-')}`;

  // Shadow transform helper
  const shadowTransform = (scale: number) =>
    `translate(${shadowOffsetX * scale}, ${shadowOffsetY * scale})`;

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', boxSizing: 'border-box' }}>
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        <defs>
          <clipPath id={`${filterId}-clip`}>
            <circle cx="100" cy="100" r="100" />
          </clipPath>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={Math.max(0.001, shadowBlur)} />
          </filter>
        </defs>

        {/* Background */}
        <circle cx="100" cy="100" r="100"
          fill={backgroundColor === 'transparent' ? 'none' : backgroundColor}
          clipPath={`url(#${filterId}-clip)`}
        />

        {/* Dial */}
        <g style={{ fill: dialColor, stroke: dialColor }} clipPath={`url(#${filterId}-clip)`}>
          <DialComp />
        </g>

        {/* Hour hand shadow */}
        {shadowOpacity > 0 && (
          <g filter={`url(#${filterId})`} opacity={shadowOpacity}
             transform={`rotate(${hourAngle}, 100, 100) ${shadowTransform(0.5)}`}
             style={{ fill: '#000', stroke: '#000' }}>
            <HourHandComp />
          </g>
        )}
        {/* Hour hand */}
        <g transform={`rotate(${hourAngle}, 100, 100)`}
           style={{ fill: hourHandColor, stroke: hourHandColor }}>
          <HourHandComp />
        </g>

        {/* Minute hand shadow */}
        {shadowOpacity > 0 && (
          <g filter={`url(#${filterId})`} opacity={shadowOpacity}
             transform={`rotate(${minuteAngle}, 100, 100) ${shadowTransform(0.75)}`}
             style={{ fill: '#000', stroke: '#000' }}>
            <MinuteHandComp />
          </g>
        )}
        {/* Minute hand */}
        <g transform={`rotate(${minuteAngle}, 100, 100)`}
           style={{ fill: minuteHandColor, stroke: minuteHandColor }}>
          <MinuteHandComp />
        </g>

        {/* Second hand shadow */}
        {shadowOpacity > 0 && (
          <g filter={`url(#${filterId})`} opacity={shadowOpacity}
             transform={`rotate(${secondAngle}, 100, 100) ${shadowTransform(1)}`}
             style={{ fill: '#000', stroke: '#000', color: '#000' }}>
            <SecondHandComp />
          </g>
        )}
        {/* Second hand + axis cover */}
        <g transform={`rotate(${secondAngle}, 100, 100)`}
           style={{ fill: secondHandColor, stroke: secondHandColor, color: secondHandColor }}>
          <SecondHandComp />
          {/* Axis cover under the second hand's rotation */}
          <g transform={`rotate(${-secondAngle}, 100, 100)`}
             style={{ fill: axisCoverColor, stroke: axisCoverColor }}>
            {axisCoverType === 'circle'  && <circle cx="100" cy="100" r={axisCoverRadius} style={{ stroke: 'none' }} />}
            {axisCoverType === 'hexagon' && <polygon points={hexPoints} style={{ stroke: 'none' }} />}
            {axisCoverType === 'octagon' && <polygon points={octPoints} style={{ stroke: 'none' }} />}
          </g>
        </g>
      </svg>
    </div>
  );
};

export default AnalogClockWidget;
