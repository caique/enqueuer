import {RequisitionModel} from '../models/inputs/requisition-model';

//TODO test it
export class RequisitionMultiplier {
    private requisition: RequisitionModel;

    public constructor (requisition: RequisitionModel) {
        this.requisition = requisition;
    }

    public multiply(): RequisitionModel[] {
        const iterations = this.requisition.iterations;
        if (!iterations || iterations == 1) {
            return [this.requisition];
        }

        let requisitions: RequisitionModel[] = [];
        for (let x = iterations; x > 0; --x) {
            const clone: RequisitionModel = {...this.requisition} as RequisitionModel;
            clone.name = clone.name + ` [${x}]`;
            requisitions = requisitions.concat(clone);
        }
        return requisitions;
    }
}