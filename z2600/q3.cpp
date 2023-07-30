#include <stdio.h>

int main()
{
    int *x, *y, *z, *a, b[3] = {-3, 4, 5};
    a = new int[3]; // creating an array of 3 elements
    x = a;
    for (int k = -2; k < 1; k++)
    {
        a[k + 2] = (k + 3) % 3 + 3 * k;
        printf("%d\t", a[k + 2]);
    }
    z = &b[1];
    y = x + 2;
    printf("\n%d %d %d\n", *x, *y, *z);
    *x = *x - 4;
    *(++z) = *(--y) + *x;
    printf("%d \n", *z);
    *y++ = *&b[2] * (*--z);
    printf("\n%d %d \n", *x, *y);
    for (int j = 0; j < 3; j++)
        printf("%d %d\n", *(a + j), *(b + j));
    delete[] a;
    x = y = NULL;

    return 0;
}