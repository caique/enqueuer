declare class Tester {
    isEqualTo(label: string, actual: number, expected: number);
    isGreaterThan(label: string, actual: number, expected: number);
    isGreaterThanOrEqualTo(label: string, actual: number, expected: number);
    isLessThan(label: string, actual: number, expected: number);
    isLessThanOrEqualTo(label: string, actual: number, expected: number);
    isTruthy(label: string, expected: any);
    isFalsy(label: string, expected: any);
    contains(label: string, expected: string, toContain: string);
    isDefined(label: string, name: any);
    isUndefined(label: string, name: any);
}


