#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[])
{
    if (argc != 2)
    {
        printf("Invalid number of command line arguments given.\n");
        return 1;
    }

    int n = atoi(argv[1]);
    if (n <= 9)
    {
        printf("Number must be greater than 9.\n");
        return 1;
    }

    for (int i = 1; i <= n; i++)
    {
        int sum = 1;
        for (int j = 2; j * j <= i; j++)
        {
            if (i % j == 0)
            {
                if (j * j != i)
                {
                    sum += j;
                }
                sum += i / j;
            }
        }
        if (sum == i && i != 1)
        {
            printf("%d is a perfect number.\n", i);
        }
    }

    return 0;
}