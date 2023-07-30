#include <stdio.h>

int main() {

    FILE *inFile = fopen("input.txt", "r");
    if (inFile == NULL)
    {
        printf("Error opening input file.\n");
        return 1;
    }

    int values[20];
    for (int i = 0; i < 20; i++)
    {
        fscanf(inFile, "%d", &(*(values + i)));
    }

    fclose(inFile);

    int sum = 0;
    int largest = *values;
    for (int i = 0; i < 20; i++)
    {
        int value = *(values + i);
        sum += value;
        if (largest < value) largest = value;
    }

    float average = sum / 20.0;

    FILE* outFile = fopen("output.txt", "w");
    if (outFile == NULL)
    {
        printf("Error opening output file.\n");
        return 1;
    }

    fprintf(outFile, "The largest integer is: %d\n", largest);
    fprintf(outFile, "The sum of integers is: %d\n", sum);
    fprintf(outFile, "The average of the integers is: %.2f\n", average);

    return 0;
}