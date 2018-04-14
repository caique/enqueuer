export class PlaceHolderReplacer {
    private variablesMap: {}[] = [];

    public addVariableMap(variableMap: object): PlaceHolderReplacer {
        this.variablesMap.unshift(variableMap);
        return this;
    }

    public replace(json: {}): {} {
        var str = JSON.stringify(json);
        var output = str.replace(/{{\w+}}/g, (placeHolder: string): string => {
            const key: string = placeHolder.substr(2, placeHolder.length - 4);
            return this.checkInEveryMap(key) || placeHolder;
        });

        // Array must have the first and last " stripped
        // otherwise the JSON object won't be valid on parse
        output = output.replace(/"\[(.*)\]"/, '[$1]');

        return JSON.parse(output);

    }

    private checkInEveryMap(key: string): string | null{
        let map: any = {};
        for (map of this.variablesMap) {
            const variableValue: any = map[key];

            if (variableValue) {
                if (typeof variableValue == 'object') {
                    // Stringify if not string yet
                    return JSON.stringify(variableValue);
                }
                return variableValue;
            }
        }
        return null;
    }
}