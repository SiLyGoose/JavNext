#include <stdio.h>
#include <stdlib.h>

int main(int argc, char* argv[])
{
    if (argc != 4)
    {
        printf("Invalid number of command line arguments given.\n");
        return 1;
    }

    char* inFileName = argv[1];

    FILE* inFile = fopen(inFileName, "r");
    if (inFile == NULL)
    {
        printf("Error opening input file.\n");
        return 1;
    }

    int size = atoi(argv[2]);
    float* values = (float*) malloc(size * sizeof(float));
    if (values == NULL)
    {
        printf("Error allocating memory.\n");
        return 1;
    }

    for (int i = 0; i < size; i++)
    {
        fscanf(inFile, "%f", &(*(values + i)));
    }

    fclose(inFile);

    float searchValue = atof(argv[3]);
    for (int i = 0; i < size; i++)
    {
        if (*(values + i) == searchValue)
        {
            printf("Number %.2f found at index %d.\n", searchValue, i);
            break;
        }
    }

    for (int i = size - 1; i >= 0; i--)
    {
        printf("%.2f ", *(values + i));
    }

    printf("\n");

    free(values);

    return 0;
}